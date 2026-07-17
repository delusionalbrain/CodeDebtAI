from shared.shared_models import FileAnalysis, FileContext
from shared.config import (
    HIGH_COMPLEXITY_THRESHOLD,
    TOP_N_FILES
)

def _grade_is_high(grade: str) -> bool:
    """A-F scale, C or worse counts as high complexity."""
    return grade >= HIGH_COMPLEXITY_THRESHOLD

def get_severity(score: float) -> str:
    if score >= 80: return "Critical"
    elif score >= 60: return "High"
    elif score >= 40: return "Medium"
    else: return "Low"

def get_file_line_count(file_path: str) -> int:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return sum(1 for _ in f)
    except Exception:
        return 1

def apply_priority_rule(file_analysis: FileAnalysis) -> tuple[bool, float]:
    """Flag files based on complexity and maintainability."""
    flagged = _grade_is_high(file_analysis.complexity_grade)

    # A lower maintainability index means worse code.
    # A higher complexity score means worse code.
    # We want a high priority score for bad code.
    base_score = (100.0 - file_analysis.maintainability_index) + file_analysis.complexity_score
    priority_score = min(max(base_score, 0.0), 100.0)

    # If priority score is high, ensure it is flagged even if complexity grade is borderline
    if priority_score >= 40:
        flagged = True

    return flagged, priority_score

import concurrent.futures
from groq import Groq
from shared.config import LLM_MODEL

def _generate_llm_reason(file_ctx: FileContext) -> str:
    """Uses Groq to generate a 1-sentence reason based on the code."""
    try:
        client = Groq()
        with open(file_ctx.file_path, "r", encoding="utf-8") as f:
            code = f.read()
        
        # Truncate very long files so we don't blow up the context window
        if len(code) > 10000:
            code = code[:10000] + "\n...[truncated]"

        prompt = f"""You are an expert python developer. 
This code was flagged for technical debt (Complexity: {file_ctx.complexity_grade}, Maintainability: {file_ctx.maintainability_index:.1f}).
In ONE short sentence (max 15 words), explain what makes this code difficult to maintain or overly complex. 
Do not include any pleasantries or introductory text. Do not use quotes. Just the reason.

Code:
{code}"""
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=60,
            temperature=0.3
        )
        reason = response.choices[0].message.content.strip().replace('"', '')
        return reason if reason else "Requires manual review."
    except Exception as e:
        return f"Requires manual review (AI generation failed)."

def compute_priority(analyzed_files: list[FileAnalysis], repo_path: str) -> list[FileContext]:
    """Context Agent entry point - called by orchestrator."""
    contextualized = []

    for file_analysis in analyzed_files:
        flagged, priority_score = apply_priority_rule(file_analysis)
        severity = get_severity(priority_score)
        line_count = get_file_line_count(file_analysis.file_path)

        contextualized.append(FileContext(
            **file_analysis.model_dump(),
            priority_flag=flagged,
            priority_score=priority_score,
            severity=severity,
            line_start=1,
            line_end=line_count
        ))

    flagged_only = [f for f in contextualized if f.priority_flag]
    flagged_only.sort(key=lambda f: f.priority_score, reverse=True)
    top_files = flagged_only[:TOP_N_FILES]

    if top_files:
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(10, len(top_files))) as executor:
            reasons = list(executor.map(_generate_llm_reason, top_files))
            
        for i, reason in enumerate(reasons):
            top_files[i].llm_reason = reason

    return top_files