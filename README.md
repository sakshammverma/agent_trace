# AGENT-TRACE // AI Agent Security & Architecture Inspector

A production-grade telemetry, formal topology verification, and runtime guardrail engine for multi-agent LLM systems.

---

## Key Features

1. **Topology Graph Analyzer (`backend/agent_trace_engine.py`)**
   - Detects unbounded cycle deadlocks and cascading infinite tool loops.
   - Identifies untrusted external user input reaching critical execution sinks without sanitization.
   - Computes architectural risk scores and auto-generates remediation diffs.

2. **Hardened Runtime Guardrails (`backend/guardrails.py`)**
   - **Taint Boundary Isolation**: Regex sanitization against jailbreaks, delimiter injections, and canary token validation.
   - **Circuit Breaker**: Exponential backoff, trip threshold enforcement, and cooloff state transitions (`CLOSED`, `OPEN`, `HALF_OPEN`).
   - **Hardware Permission Ceiling**: Dollar transaction limits, restricted tool execution, and human-in-the-loop sign-off.

3. **FastAPI Service Layer (`backend/api.py`)**
   - Real-time simulation endpoints for injection attacks, deadlock loops, and privilege escalation.
   - Serves the architectural blueprint visualizer over HTTP.

4. **Architectural Blueprint Visualizer (`index.html`)**
   - Brutalist architectural CAD aesthetic on `#F5F5EF` paper with `#FA3600` hazard accents.
   - Interactive SVG vector topology inspector with live node dragging, animated violation vectors, and red-team sandbox.
   - Built-in presentation deck mode for academic defense and live technical demonstration.

---

## Quickstart

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run FastAPI service
uvicorn backend.api:app --reload --port 8000
```
Open `http://localhost:8000` to inspect the blueprint canvas and run red-team simulations.
