import sys
import os
import uuid
import io
from datetime import datetime
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# --- PDF Generation Imports ---
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# --- Load Environment Variables ---
from dotenv import load_dotenv
load_dotenv()

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
# (This MUST be defined before any @app.post or @app.get routes!)
app = FastAPI(title="Code Debt Analyzer API")

# Add CORS middleware to allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development.
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

@app.post("/export-pdf")
def export_pdf_report(payload: dict):
    """
    Receives dashboard telemetry payload and returns a beautifully structured PDF document stream.
    """
    buffer = io.BytesIO()
    
    # Setup document template
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom Colors
    primary_color = colors.HexColor("#4f46e5")    # Indigo
    dark_neutral = colors.HexColor("#1e293b")     # Slate 800
    light_neutral = colors.HexColor("#f8fafc")    # Slate 50
    border_color = colors.HexColor("#e2e8f0")     # Slate 200
    
    # Typography Styles
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=dark_neutral,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=20
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155")
    )

    # 1. Header Information
    repo_name = payload.get("repoName", "Repository")
    story.append(Paragraph("CodeDebtAI Analysis Report", title_style))
    gen_date = datetime.now().strftime("%B %d, %Y")
    story.append(Paragraph(f"Repository: <b>{repo_name}</b>  |  Generated on: {gen_date}", subtitle_style))
    story.append(Spacer(1, 10))

    # Extract dashboard details with fallbacks
    db_data = payload.get("dashboardData", {})
    debt_score = db_data.get("debt_score") or db_data.get("grade") or db_data.get("overallScore") or "B-"
    effort = db_data.get("estimated_effort") or db_data.get("effort") or db_data.get("estimatedEffort") or "TBD"
    total_issues = db_data.get("total_issues") or db_data.get("issues_count") or db_data.get("totalIssues") or "0"
    duplication = db_data.get("duplication") or db_data.get("code_duplication") or "0%"

    # 2. Score Metrics Layout
    stats_data = [
        [
            Paragraph("<b>Overall Debt Score</b>", body_style),
            Paragraph("<b>Estimated Repair Effort</b>", body_style)
        ],
        [
            Paragraph(f"<font size=20 color='#e11d48'><b>{debt_score}</b></font>", body_style),
            Paragraph(f"<font size=20 color='#4f46e5'><b>{effort}</b></font>", body_style)
        ],
        [
            Paragraph("<b>Total Issues Detected</b>", body_style),
            Paragraph("<b>Code Duplication Rate</b>", body_style)
        ],
        [
            Paragraph(f"<font size=20 color='#d97706'><b>{total_issues}</b></font>", body_style),
            Paragraph(f"<font size=20 color='#0d9488'><b>{duplication}</b></font>", body_style)
        ]
    ]
    
    stats_table = Table(stats_data, colWidths=[260, 260])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), light_neutral),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
    ]))
    
    story.append(stats_table)
    story.append(Spacer(1, 25))

    # 3. Text Summaries
    story.append(Paragraph("Executive Summary", section_heading))
    summary_text = (
        "This automated report evaluates structural design metrics, technical liability, "
        "and package orchestration complexities inside the source workspace. Issues are flagged "
        "using deep static analysis and prioritized according to risk profiles, structural coupling, "
        "and modular testability."
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 20))

    story.append(Paragraph("Immediate Remediation Strategy", section_heading))
    strategy_text = (
        "We recommend prioritizing architectural design issues over styling inconsistencies. "
        "Establish unified dependency tracking (consolidate separate requirement lists) and isolate API "
        "initializations to clean local run environments to prevent runtime loop crashes."
    )
    story.append(Paragraph(strategy_text, body_style))

    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename={repo_name}-analysis-report.pdf"}
    )


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
        repo_name = request.repo_url.rstrip("/").split("/")[-1].replace(".git", "")
        repo_path = os.path.join(TEMP_CLONE_DIR, repo_name)

        if not os.path.exists(repo_path):
            raise HTTPException(status_code=400, detail="Repository not found locally. Run /analyze first.")

        internal_request = FixRequest(
            file_path=request.file_path,
            issue_reason=request.issue_reason
        )

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
            
        apply_fix(repo_path, request.file_path, request.suggested_code)
        
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