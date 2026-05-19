#!/usr/bin/env python3
"""
==============================================================================
AGENT-TRACE // FASTAPI SERVICE LAYER
Serves the static blueprint UI and exposes the real guardrail engine
(guardrails.py) + topology analyzer (agent_trace_engine.py) over HTTP.
==============================================================================
"""

import os
import time
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel

from .guardrails import CircuitBreaker, TaintBoundaryIsolation, HardwarePermissionCeiling, SecurityViolationError
from .agent_trace_engine import AgentTraceBackend, DEFAULT_WORKFLOW

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(title="AGENT-TRACE API")

# Keeps the results of the most recent topology analysis so the report
# endpoint reflects what actually ran instead of hardcoded numbers.
_last_analysis = {"vulnerabilities": [], "timestamp": None}


class InjectionRequest(BaseModel):
    payload: str


class DeadlockRequest(BaseModel):
    max_retries: int = 3
    fail_count: int = 5


class PrivilegeRequest(BaseModel):
    amount: float
    tool: str = "unspecified"


@app.post("/api/simulate/injection")
def simulate_injection(req: InjectionRequest):
    """Runs user-supplied text through the real TaintBoundaryIsolation guardrail."""
    guarded = TaintBoundaryIsolation(strict_mode=True, nonce="AGENT_TRACE_NONCE_984")

    matched_patterns = [p.pattern for p in guarded.INJECTION_PATTERNS if p.search(req.payload)]

    @guarded
    def ingress(raw_input: str) -> str:
        return raw_input

    events = [{"type": "info", "text": f"INGEST: Payload received ({len(req.payload)} chars)"}]

    try:
        sanitized = ingress(req.payload)
        events.append({"type": "success", "text": "TAINT BOUNDARY: No injection signature matched. Payload isolated in nonce envelope."})
        return {
            "blocked": False,
            "matched_patterns": matched_patterns,
            "sanitized_output": sanitized,
            "events": events,
        }
    except SecurityViolationError as exc:
        events.append({"type": "vuln", "text": f"ANOMALY: Injection signature matched: {matched_patterns}"})
        events.append({"type": "success", "text": f"SENTINEL INTERCEPT: {exc}"})
        return {
            "blocked": True,
            "matched_patterns": matched_patterns,
            "sanitized_output": None,
            "events": events,
        }


@app.post("/api/simulate/deadlock")
def simulate_deadlock(req: DeadlockRequest):
    """Drives the real CircuitBreaker against a handler that always fails, to show the trip."""
    breaker = CircuitBreaker(max_retries=req.max_retries, timeout_sec=5.0, fallback_action="escalate_to_human")

    @breaker
    def failure_handler(state: dict) -> dict:
        return {**state, "status": "retry_handled", "retry_count": state.get("retry_count", 0) + 1}

    state = {"session_id": f"sim_{time.time_ns()}", "retry_count": 0}
    events = [{"type": "info", "text": f"AGENT DISPATCH: Simulating {req.fail_count} consecutive failures (ceiling={req.max_retries})"}]

    tripped_at = None
    for attempt in range(1, req.fail_count + 1):
        state = failure_handler(state)
        if state.get("status") == "TERMINATED_BY_GUARDRAIL":
            tripped_at = attempt
            events.append({"type": "success", "text": f"CIRCUIT BREAKER TRIPPED at attempt {attempt}: {state['error']}"})
            break
        events.append({"type": "vuln", "text": f"ROUND {attempt:02d}: retry handled, no convergence yet"})

    if tripped_at is None:
        events.append({"type": "info", "text": "Circuit breaker did not trip within fail_count attempts."})

    return {"tripped": tripped_at is not None, "tripped_at_attempt": tripped_at, "final_state": state, "events": events}


@app.post("/api/simulate/privilege")
def simulate_privilege(req: PrivilegeRequest):
    """Runs a requested action through the real HardwarePermissionCeiling guardrail."""
    ceiling = HardwarePermissionCeiling(max_financial_limit=50000.0, require_2fa=True)

    @ceiling
    def execute(trade_params: dict) -> dict:
        return {"status": "executed", **trade_params}

    events = [{"type": "info", "text": f"NODE REQUEST: tool='{req.tool}' amount=${req.amount:,.2f}"}]

    try:
        result = execute({"amount": req.amount, "tool": req.tool})
        events.append({"type": "success", "text": "CAPABILITY CHECK PASSED: within least-privilege ceiling."})
        return {"blocked": False, "result": result, "events": events}
    except SecurityViolationError as exc:
        events.append({"type": "vuln", "text": f"EXPOSURE: {exc}"})
        events.append({"type": "success", "text": "PATCH DEPLOYED: request denied by capability filter."})
        return {"blocked": True, "result": None, "events": events}


@app.post("/api/analyze")
def analyze(workflow: dict | None = None):
    """Runs the real topology analyzer from agent_trace_engine.py."""
    backend = AgentTraceBackend(workflow_data=workflow)
    backend.analyze_reachability()

    _last_analysis["vulnerabilities"] = backend.vulnerabilities
    _last_analysis["timestamp"] = datetime.now(timezone.utc).isoformat()

    return {
        "workflow_name": backend.data.get("name"),
        "node_count": len(backend.nodes),
        "edge_count": len(backend.edges),
        "vulnerabilities": backend.vulnerabilities,
    }


@app.get("/api/report", response_class=PlainTextResponse)
def report():
    """Builds the audit report from the most recent /api/analyze run (or the default workflow if none has run yet)."""
    if not _last_analysis["timestamp"]:
        backend = AgentTraceBackend(workflow_data=DEFAULT_WORKFLOW)
        backend.analyze_reachability()
        _last_analysis["vulnerabilities"] = backend.vulnerabilities
        _last_analysis["timestamp"] = datetime.now(timezone.utc).isoformat()

    vulns = _last_analysis["vulnerabilities"]
    lines = [
        "# SECURITY AUDIT & VERIFICATION REPORT",
        "Generated by: AGENT-TRACE v4.2",
        f"Analysis timestamp: {_last_analysis['timestamp']}",
        "",
        "=" * 80,
        "1. DETECTED VULNERABILITY MATRIX",
        "=" * 80,
    ]
    for idx, v in enumerate(vulns, 1):
        lines += [
            f"[{idx:02d}] {v['id']} // {v['severity']}",
            f"     Title  : {v['title']}",
            f"     Node   : {v['node']}",
            f"     Detail : {v['desc']}",
            f"     Patch  : @{v['patch_type']}() wrapper synthesized",
            "",
        ]
    lines.append(f"Total vulnerabilities flagged: {len(vulns)}")
    return "\n".join(lines)


# Serve the static frontend (index.html, css/, js/, assets/) at the root.
app.mount("/css", StaticFiles(directory=os.path.join(ROOT_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(ROOT_DIR, "js")), name="js")
app.mount("/assets", StaticFiles(directory=os.path.join(ROOT_DIR, "assets")), name="assets")


@app.get("/")
def index():
    return FileResponse(os.path.join(ROOT_DIR, "index.html"))
