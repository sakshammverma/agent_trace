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

