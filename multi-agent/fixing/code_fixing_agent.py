import os
import difflib
from groq import Groq
from shared.shared_models import FixRequest, FixResponse
from shared.config import LLM_MODEL

client = Groq()  # reads GROQ_API_KEY from environment variable

def read_file_content(repo_path: str, relative_file_path: str) -> str:
    """Read the original source code of the selected file."""
    full_path = os.path.join(repo_path, relative_file_path)
    with open(full_path, "r", encoding="utf-8") as f:
        return f.read()

def generate_fix(original_code: str, issue_reason: str) -> str:
    """Call the LLM to suggest an improved version of the code."""
    prompt = f"""The following Python file was flagged for technical debt: {issue_reason}

Suggest an improved version of this code that reduces complexity while preserving exact behavior. Return ONLY the full corrected code, no explanation, no markdown fences.

Original code:
{original_code}
"""
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4000
    )
    code = response.choices[0].message.content

    # Strip markdown fences defensively, since some models add them despite instructions
    code = code.strip()
    if code.startswith("```"):
        lines = code.split("\n")
        lines = lines[1:]  # remove opening fence line
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]  # remove closing fence line
        code = "\n".join(lines)

    return code

def build_diff(original_code: str, suggested_code: str) -> tuple[list[dict], list[int], list[int]]:
    """Line-by-line diff structure and line number mapping."""
    diff_lines = list(difflib.unified_diff(
        original_code.splitlines(),
        suggested_code.splitlines(),
        lineterm=""
    ))

    structured_diff = []
    flagged_lines = []
    suggested_lines = []
    
    orig_idx = 0
    new_idx = 0

    for line in diff_lines:
        if line.startswith("@@"):
            # @@ -start,count +start,count @@
            parts = line.split(" ")
            orig_start = int(parts[1].split(",")[0].replace("-", ""))
            new_start = int(parts[2].split(",")[0].replace("+", ""))
            orig_idx = orig_start
            new_idx = new_start
        elif line.startswith("-") and not line.startswith("---"):
            structured_diff.append({"type": "remove", "content": line[1:]})
            flagged_lines.append(orig_idx)
            orig_idx += 1
        elif line.startswith("+") and not line.startswith("+++"):
            structured_diff.append({"type": "add", "content": line[1:]})
            suggested_lines.append(new_idx)
            new_idx += 1
        elif not line.startswith(("+++", "---")):
            structured_diff.append({"type": "context", "content": line})
            # Context lines exist in both, so increment both counters
            orig_idx += 1
            new_idx += 1

    return structured_diff, flagged_lines, suggested_lines

from shared.shared_models import FixRequest, FixResponse

def fix_file(request: FixRequest, repo_path: str) -> FixResponse:
    """Code Fixing Agent entry point - called by backend on dropdown selection."""
    from fixing.fix_graph import fix_graph_app  # import here to avoid circular import

    result = fix_graph_app.invoke({
        "repo_path": repo_path,
        "file_path": request.file_path,
        "issue_reason": request.issue_reason,
        "original_code": None,
        "suggested_code": None,
        "diff": None,
        "flagged_lines": None,
        "suggested_lines": None,
        "fix_valid": None,
        "retry_count": 0,
        "trace": []
    })

    return FixResponse(
        file_path=request.file_path,
        original_code=result["original_code"],
        suggested_code=result["suggested_code"],
        flagged_lines=result.get("flagged_lines", []),
        suggested_lines=result.get("suggested_lines", []),
        diff=result["diff"]
    )

def apply_fix(repo_path: str, relative_file_path: str, suggested_code: str) -> bool:
    """Writes suggested code to file - only called after human clicks 'Apply' in UI."""
    full_path = os.path.join(repo_path, relative_file_path)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(suggested_code)
    return True