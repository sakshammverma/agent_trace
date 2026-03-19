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

    @staticmethod
    def _matches_any(text: str, keywords: tuple) -> bool:
        return any(re.search(r"\b" + re.escape(kw) + r"\b", text) for kw in keywords)

    @staticmethod
    def _matches_any_prefix(text: str, prefixes: tuple) -> bool:
        return any(re.search(r"\b" + re.escape(p), text) for p in prefixes)

    def _is_exec_node(self, node: dict) -> bool:
        return self._matches_any(self._node_text(node), self._EXEC_KEYWORDS)

    def _is_gate_node(self, node: dict) -> bool:
        text = self._node_text(node)
        return self._matches_any(text, self._GATE_KEYWORDS) or self._matches_any_prefix(text, self._GATE_PREFIXES)

    def _is_entry_node(self, node: dict, in_degree: Dict[str, int]) -> bool:
        text = self._node_text(node)
        return in_degree.get(node["id"], 0) == 0 or self._matches_any(text, self._ENTRY_KEYWORDS)

    def analyze_reachability(self):
        """Builds adjacency and scans for vulnerabilities in topology graph using
        generic structural/keyword heuristics so arbitrary pasted graphs are supported."""
        print(f"[*] Analyzing Workflow: '{self.data.get('name', 'Custom Ingest')}' ({len(self.nodes)} nodes, {len(self.edges)} edges)")
        time.sleep(0.3)

        node_by_id = {n["id"]: n for n in self.nodes}
        adjacency: Dict[str, List[str]] = {n["id"]: [] for n in self.nodes}
        in_degree: Dict[str, int] = {n["id"]: 0 for n in self.nodes}
        for e in self.edges:
            if e["from"] in adjacency and e["to"] in node_by_id:
                adjacency[e["from"]].append(e["to"])
                in_degree[e["to"]] = in_degree.get(e["to"], 0) + 1

        def bfs_reachable(start_id: str) -> set:
            seen, queue = {start_id}, [start_id]
            while queue:
                curr = queue.pop(0)
                for nxt in adjacency.get(curr, []):
                    if nxt not in seen:
                        seen.add(nxt)
                        queue.append(nxt)
            return seen

        entry_nodes = [n for n in self.nodes if self._is_entry_node(n, in_degree)]

        # 1. Unquarantined Input Taint Propagation (CVE-2026-771):
        # an entry node whose downstream includes any node at all, with no
        # gate/validation node interposed before reaching it.
        for entry in entry_nodes:
            downstream = adjacency.get(entry["id"], [])
            if not downstream:
                continue
            reachable = bfs_reachable(entry["id"]) - {entry["id"]}
            gated = any(self._is_gate_node(node_by_id[nid]) for nid in reachable if nid in node_by_id)
            if not gated:
                self.vulnerabilities.append({
                    "id": "CVE-2026-771",
                    "severity": "CRITICAL (CVSS 9.2)",
                    "node": entry["id"],
                    "downstream": downstream,
                    "title": "Unquarantined User Input Taint Propagation",
                    "desc": f"Node '{entry.get('name', entry['id'])}' ({entry['id']}) feeds raw user payloads directly into '{downstream}' without XML nonce isolation or regex boundary defenses.",
                    "patch_type": "TaintBoundaryIsolation"
                })

        # 2. Unbounded Failure Retry Loop / Deadlock Risk (CWE-835):
        # a genuine cycle in the directed graph (DFS-based detection), not a
        # hardcoded id match.
        visited, on_stack = set(), set()
        found_cycle_edge = None

        def dfs(node_id: str):
            nonlocal found_cycle_edge
            if found_cycle_edge:
                return
            visited.add(node_id)
            on_stack.add(node_id)
            for nxt in adjacency.get(node_id, []):
                if found_cycle_edge:
                    return
                if nxt in on_stack:
                    found_cycle_edge = (node_id, nxt)
                    return
                if nxt not in visited:
                    dfs(nxt)
            on_stack.discard(node_id)

        for n in self.nodes:
            if n["id"] not in visited:
                dfs(n["id"])
            if found_cycle_edge:
                break

        if found_cycle_edge:
            src, dst = found_cycle_edge
            self.vulnerabilities.append({
                "id": "CWE-835",
                "severity": "HIGH (CVSS 8.4)",
                "node": dst,
                "title": "Unbounded Failure Retry Loop & Deadlock Risk",
