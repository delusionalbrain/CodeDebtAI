from shared.shared_models import FileContext, FileAnalysis, ReportItem, ReportOutput, SeverityDistribution

def _build_reason(file_ctx: FileContext) -> str:
    """Human-readable explanation for why this file was flagged."""
    if file_ctx.llm_reason:
        return file_ctx.llm_reason

    reasons = []
    
    if file_ctx.complexity_grade >= 'C':
        reasons.append(f"High complexity ({file_ctx.complexity_grade})")
        
    if file_ctx.maintainability_index < 60:
        reasons.append(f"Low maintainability index ({file_ctx.maintainability_index:.1f})")
        
    if not reasons:
        reasons.append(f"Moderate complexity ({file_ctx.complexity_grade})")
        
    reason_str = " & ".join(reasons).capitalize()
    return f"{reason_str} — Priority score: {file_ctx.priority_score:.1f}"

def _build_summary(flagged_files: list[FileContext]) -> str:
    """Short overview line for the top of the dashboard report."""
    if not flagged_files:
        return "No high-priority technical debt found in this repository."

    count = len(flagged_files)
    top_file = flagged_files[0].file_path.split("/")[-1]
    return f"{count} file(s) flagged for review. Highest priority: {top_file}."

import os

def build_report(flagged_files: list[FileContext], analyzed_files: list[FileAnalysis], repo_path: str = None) -> ReportOutput:
    """Report Agent entry point - called by orchestrator."""
    report_items = []
    
    distribution = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    total_debt = 0
    
    for f in flagged_files:
        distribution[f.severity] += 1
        total_debt += int(f.priority_score)
        
        display_path = f.file_path
        if repo_path and display_path.startswith(repo_path):
            display_path = os.path.relpath(display_path, repo_path).replace("\\", "/")
        
        report_items.append(ReportItem(
            line_start=f.line_start,
            line_end=f.line_end,
            file_path=display_path,
            priority_score=f.priority_score,
            severity=f.severity,
            complexity_grade=f.complexity_grade,
            maintainability_index=f.maintainability_index,
            reason=_build_reason(f)
        ))

    summary = _build_summary(flagged_files)
    
    files_scanned = len(analyzed_files)
    # Basic health score: 100 - average debt per file, bounded to 0-100
    health_score = 100
    if files_scanned > 0:
        avg_debt = total_debt / files_scanned
        health_score = max(0, int(100 - avg_debt))

    return ReportOutput(
        summary=summary,
        health_score=health_score,
        files_scanned=files_scanned,
        total_debt_score=total_debt,
        severity_distribution=SeverityDistribution(
            critical=distribution["Critical"],
            high=distribution["High"],
            medium=distribution["Medium"],
            low=distribution["Low"]
        ),
        files=report_items
    )