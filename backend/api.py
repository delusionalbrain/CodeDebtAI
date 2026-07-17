import sys
import os
import uuid
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- Path Routing ---
# Add the multi-agent directory to the Python path so we can import the agents
current_dir = os.path.dirname(os.path.abspath(__file__))
multi_agent_dir = os.path.join(current_dir, "..", "multi-agent")
sys.path.append(multi_agent_dir)

# Now we can import from multi-agent
from analysis.agent_graph import run_agentic_pipeline, app_graph
from fixing.code_fixing_agent import fix_file, apply_fix
from shared.shared_models import FixRequest, ReportOutput
from shared.config import TEMP_CLONE_DIR

# --- App Setup ---
app = FastAPI(title="Code Debt Analyzer API")

# Add CORS middleware to allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. In production, change to specific frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for API Requests ---
class AnalyzeRequest(BaseModel):
    repo_url: str

class APIFixRequest(BaseModel):
    repo_url: str
    file_path: str
    issue_reason: str

class ApplyFixRequest(BaseModel):
    repo_url: str
    file_path: str
    suggested_code: str
    github_token: str | None = None

# --- Pydantic Model for API Response ---
class AnalyzeResponse(BaseModel):
    analysis_id: str
    status: str
    repo_name: str
    dashboard: ReportOutput
    review_items: list
    trace: list[str]

# --- Endpoints ---

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_repo(request: AnalyzeRequest):
    """
    Analyzes a GitHub repository for technical debt using an agentic LangGraph
    pipeline, and returns a prioritized report along with the agent's decision trace.
    """
    try:
        report, repo_path, trace = run_agentic_pipeline(request.repo_url)
        repo_name = request.repo_url.rstrip("/").split("/")[-1].replace(".git", "")
        return AnalyzeResponse(
            analysis_id=str(uuid.uuid4()),
            status="completed",
            repo_name=repo_name,
            dashboard=report,
            review_items=[],
            trace=trace
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/analysis/{analysis_id}/events")
async def analysis_events(websocket: WebSocket, analysis_id: str, repo_url: str):
    await websocket.accept()
    try:
        state = {
            "repo_url": repo_url,
            "trace": [],
            "done": False,
            "repo_path": None,
            "file_list": [],
            "analyzed_files": [],
            "flagged_files": [],
            "report": None,
            "next_action": None
        }
        await websocket.send_json({"event": "analysis_started", "payload": {"repo_url": repo_url, "analysis_id": analysis_id}})
        
        step_count = 0
        total_steps = 4
        
        for event in app_graph.stream(state):
            for key, value in event.items():
                step_count += 1
                trace_msgs = value.get("trace", [])
                msg = trace_msgs[-1] if trace_msgs else f"Running {key}..."
                pct = int((step_count / total_steps) * 100)
                await websocket.send_json({
                    "event": "progress_update",
                    "payload": {"step": key, "percent_complete": min(pct, 100), "message": msg}
                })
                
                if value.get("done"):
                    dashboard = value["report"].model_dump()
                    await websocket.send_json({
                        "event": "analysis_completed",
                        "payload": {
                            "dashboard": dashboard,
                            "review_items": [],
                            "trace": value.get("trace", [])
                        }
                    })
                    break
    except Exception as e:
        await websocket.send_json({"event": "analysis_failed", "payload": {"error_message": str(e)}})

@app.post("/fix")
def fix_code_debt(request: APIFixRequest):
    """
    Generates an LLM-suggested fix for a specific flagged file, using a
    generate -> validate -> retry agentic loop internally.
    """
    try:
        # Reconstruct the local repository path
        repo_name = request.repo_url.rstrip("/").split("/")[-1].replace(".git", "")
        repo_path = os.path.join(TEMP_CLONE_DIR, repo_name)

        if not os.path.exists(repo_path):
            raise HTTPException(status_code=400, detail="Repository not found locally. Run /analyze first.")

        # Create the internal FixRequest model expected by the agent
        internal_request = FixRequest(
            file_path=request.file_path,
            issue_reason=request.issue_reason
        )

        # Call the Code Fixing Agent
        fix_response = fix_file(internal_request, repo_path)
        return fix_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fix/apply")
def apply_fix_endpoint(request: ApplyFixRequest):
    try:
        repo_name = request.repo_url.rstrip("/").split("/")[-1].replace(".git", "")
        repo_path = os.path.join(TEMP_CLONE_DIR, repo_name)
        
        if not os.path.exists(repo_path):
            raise HTTPException(status_code=400, detail="Repository not found locally.")
            
        # 1. Apply fix locally first
        apply_fix(repo_path, request.file_path, request.suggested_code)
        
        # 2. If a token was provided, push to GitHub
        message = "Applied changes locally."
        if request.github_token:
            from github_agent import create_github_pr
            pr_url = create_github_pr(
                request.repo_url, 
                request.file_path, 
                request.suggested_code, 
                request.github_token
            )
            message = f"Applied locally and created PR: {pr_url}"
        
        return {"success": True, "message": message, "pr_url": pr_url if request.github_token else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))