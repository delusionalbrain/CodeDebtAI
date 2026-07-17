from typing import TypedDict, Optional

class FixState(TypedDict):
    repo_path: str
    file_path: str            # relative path, as used by read_file_content
    issue_reason: str
    original_code: Optional[str]
    suggested_code: Optional[str]
    diff: Optional[list[dict]]
    flagged_lines: list[int]
    suggested_lines: list[int]
    fix_valid: Optional[bool]
    retry_count: int
    trace: list[str]