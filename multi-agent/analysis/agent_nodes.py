from analysis.agent_state import AgentState
from analysis.orchestrator import clone_repo, get_python_files
from analysis.tool_execution import run_static_analysis
from analysis.context_agent import compute_priority
from analysis.report_agent import build_report

def clone_node(state: AgentState) -> dict:
    repo_path = clone_repo(state["repo_url"])
    file_list = get_python_files(repo_path)
    return {
        "repo_path": repo_path,
        "file_list": file_list,
        "trace": state["trace"] + ["Cloned repo"]
    }


def analyze_node(state: AgentState) -> dict:
    analyzed = run_static_analysis(state["file_list"])
    return {
        "analyzed_files": analyzed,
        "trace": state["trace"] + [f"Analyzed {len(analyzed)} files"]
    }


def contextualize_node(state: AgentState) -> dict:
    flagged = compute_priority(state["analyzed_files"], state["repo_path"])
    return {
        "flagged_files": flagged,
        "trace": state["trace"] + [f"Flagged {len(flagged)} files"]
    }


def report_node(state: AgentState) -> dict:
    if state.get("next_action") == "skip_to_report":
        from shared.shared_models import ReportOutput, SeverityDistribution
        report = ReportOutput(
            summary="No files flagged for review. Repository looks clean based on static analysis.",
            health_score=100,
            files_scanned=len(state.get("analyzed_files", [])),
            total_debt_score=0,
            severity_distribution=SeverityDistribution(critical=0, high=0, medium=0, low=0),
            files=[]
        )
    else:
        report = build_report(state["flagged_files"], state["analyzed_files"], state["repo_path"])

    return {
        "report": report,
        "trace": state["trace"] + ["Report built"],
        "done": True
    }