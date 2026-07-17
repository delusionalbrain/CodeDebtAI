from pydantic import BaseModel
from typing import Optional

class FileAnalysis(BaseModel):
    file_path: str
    complexity_score: float
    complexity_grade: str          # e.g. "A"-"F" from radon
    maintainability_index: float

class FileContext(FileAnalysis):
    priority_flag: bool
    priority_score: float          # complexity_score, capped at 100
    severity: str                  # 'Critical', 'High', 'Medium', 'Low'
    line_start: int
    line_end: int
    llm_reason: str = ""           # AI generated reason

class SeverityDistribution(BaseModel):
    critical: int
    high: int
    medium: int
    low: int

class ReportItem(BaseModel):
    line_start: int
    line_end: int
    file_path: str
    priority_score: float
    severity: str
    complexity_grade: str
    maintainability_index: float
    reason: str                    # human-readable explanation

class ReportOutput(BaseModel):
    summary: str
    health_score: int
    files_scanned: int
    total_debt_score: int
    severity_distribution: SeverityDistribution
    files: list[ReportItem]

class FixRequest(BaseModel):
    file_path: str
    issue_reason: str

class FixResponse(BaseModel):
    file_path: str
    original_code: str
    suggested_code: str
    flagged_lines: list[int]
    suggested_lines: list[int]
    diff: list[dict]               # line-by-line +/- structure for UI