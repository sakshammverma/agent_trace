#!/usr/bin/env python3
"""
==============================================================================
AGENT-TRACE // AUTONOMOUS MULTI-AGENT TOPOLOGY & SECURITY BLUEPRINTER
Backend Verification Engine, AST Analyzer & Guardrail Synthesizer
==============================================================================
"""

import sys
import json
import os
import ast
import re
import time
from typing import Dict, List, Any

# Example default workflow (Matches the user's custom workflow)
DEFAULT_WORKFLOW = {
    "workflow": {
        "id": "custom_workflow_001",
        "name": "Custom Workflow",
        "version": "1.0",
        "nodes": [
            { "id": "start", "type": "trigger", "name": "Start", "config": {} },
            { "id": "input", "type": "input", "name": "Collect Input", "config": { "fields": ["user_input"] } },
            { "id": "validate", "type": "task", "name": "Validate Input", "config": { "action": "validate" } },
            { "id": "process", "type": "task", "name": "Process Data", "config": { "action": "process" } },
            { "id": "decision", "type": "condition", "name": "Decision", "config": { "condition": "process.success == true" } },
            { "id": "success", "type": "task", "name": "Success Handler", "config": { "action": "complete" } },
            { "id": "failure", "type": "task", "name": "Failure Handler", "config": { "action": "retry_or_report" } },
            { "id": "end", "type": "output", "name": "Return Result", "config": {} }
        ],
        "edges": [
            { "from": "start", "to": "input" },
            { "from": "input", "to": "validate" },
            { "from": "validate", "to": "process" },
            { "from": "process", "to": "decision" },
            { "from": "decision", "to": "success", "condition": "true" },
            { "from": "decision", "to": "failure", "condition": "false" },
            { "from": "success", "to": "end" },
            { "from": "failure", "to": "end" }
        ]
    }
}

class AgentTraceBackend:
    def __init__(self, workflow_data: dict = None):
        if workflow_data:
            self.data = workflow_data.get("workflow", workflow_data)
        else:
            self.data = DEFAULT_WORKFLOW["workflow"]
        
        self.nodes = self.data.get("nodes", [])
        self.edges = self.data.get("edges", [])
        self.vulnerabilities = []
        self.patches = []

    def print_banner(self):
        print("""
=============================================================================
  AGENT-TRACE v4.2 // MULTI-AGENT TOPOLOGY & SECURITY BLUEPRINTER
  Formal Verification & Deterministic AST Guardrail Synthesizer
=============================================================================
""")

    # Keyword sets used to classify nodes generically from id/name/role/type,
    # since pasted graphs won't share the default workflow's exact node ids.
    # Matched as whole words (via regex \b) to avoid substring collisions,
    # e.g. "gateway" must not match the "gate" keyword.
    _EXEC_KEYWORDS = ("tool", "exec", "db", "database", "bridge", "deploy",
                      "broker", "trade", "k8s", "cluster", "shell", "sql")
    _GATE_KEYWORDS = ("gate", "critic", "review", "approval", "guard",
                      "human", "hitl", "check", "sanitiz")
    # Matched as prefixes (no trailing word boundary) so "validate"/"validation" both match.
    _GATE_PREFIXES = ("valid",)
    _ENTRY_KEYWORDS = ("input", "trigger", "ingest", "start", "scraper", "gateway")

    def _node_text(self, node: dict) -> str:
        return " ".join(str(node.get(k, "")) for k in ("id", "name", "role", "type")).lower()

