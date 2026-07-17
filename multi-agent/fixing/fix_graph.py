from langgraph.graph import StateGraph, END
from fixing.fix_state import FixState
from fixing.fix_nodes import (
    read_code_node,
    generate_fix_node,
    validate_fix_node,
    build_diff_node,
    MAX_RETRIES
)

graph = StateGraph(FixState)
graph.add_node("read_code", read_code_node)
graph.add_node("generate_fix", generate_fix_node)
graph.add_node("validate_fix", validate_fix_node)
graph.add_node("build_diff", build_diff_node)

graph.set_entry_point("read_code")
graph.add_edge("read_code", "generate_fix")
graph.add_edge("generate_fix", "validate_fix")


def route_after_validation(state: FixState) -> str:
    if state["fix_valid"]:
        return "build_diff"
    if state["retry_count"] < MAX_RETRIES:
        return "generate_fix"
    # ran out of retries — proceed anyway with whatever we have, rather than crash
    return "build_diff"


graph.add_conditional_edges(
    "validate_fix",
    route_after_validation,
    {
        "generate_fix": "generate_fix",
        "build_diff": "build_diff"
    }
)
graph.add_edge("build_diff", END)

fix_graph_app = graph.compile()