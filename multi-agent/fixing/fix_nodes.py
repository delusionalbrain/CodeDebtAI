import ast
from fixing.fix_state import FixState
from fixing.code_fixing_agent import read_file_content, generate_fix, build_diff

MAX_RETRIES = 3


def read_code_node(state: FixState) -> dict:
    original_code = read_file_content(state["repo_path"], state["file_path"])
    return {
        "original_code": original_code,
        "trace": state["trace"] + ["Read original file"]
    }


def generate_fix_node(state: FixState) -> dict:
    suggested_code = generate_fix(state["original_code"], state["issue_reason"])
    return {
        "suggested_code": suggested_code,
        "trace": state["trace"] + [f"Generated fix (attempt {state['retry_count'] + 1})"]
    }


def validate_fix_node(state: FixState) -> dict:
    """Check the suggested code actually parses as valid Python."""
    try:
        ast.parse(state["suggested_code"])
        return {
            "fix_valid": True,
            "trace": state["trace"] + ["Validation passed: suggested code parses"]
        }
    except SyntaxError as e:
        return {
            "fix_valid": False,
            "retry_count": state["retry_count"] + 1,
            "trace": state["trace"] + [f"Validation failed: {e}"]
        }


def build_diff_node(state: FixState) -> dict:
    diff, flagged_lines, suggested_lines = build_diff(state["original_code"], state["suggested_code"])
    return {
        "diff": diff,
        "flagged_lines": flagged_lines,
        "suggested_lines": suggested_lines,
        "trace": state["trace"] + ["Diff built"]
    }