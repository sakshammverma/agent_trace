"""
AGENT-TRACE // DETERMINISTIC AST GUARDRAIL PRIMITIVES
Runtime hooks and decorators synthesized by the AGENT-TRACE verification engine.
"""

import functools
import time
import re
import html
from typing import Callable, Any, Dict

class SecurityViolationError(Exception):
    """Raised when an unverified agent action or taint payload violates security boundary."""
    pass

class CircuitBreaker:
    """
    AST Guardrail (CWE-835 Remediation):
    Enforces a strict monotonic retry ceiling and execution timeout on recursive
    decision/failure branches to eliminate circular state deadlocks.
    """
    def __init__(self, max_retries: int = 3, timeout_sec: float = 10.0, fallback_action: str = "dead_letter_queue"):
        self.max_retries = max_retries
        self.timeout_sec = timeout_sec
        self.fallback_action = fallback_action
        self._history: Dict[str, int] = {}

    def __call__(self, func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(state: dict, *args, **kwargs) -> dict:
            session_id = state.get("session_id", "default")
            curr_retries = self._history.get(session_id, 0)

            if curr_retries >= self.max_retries:
                # Trip circuit breaker
                print(f"[AGENT-TRACE ALERT] Circuit Breaker Tripped: {func.__name__} exceeded {self.max_retries} retries.")
                return {
                    **state,
                    "status": "TERMINATED_BY_GUARDRAIL",
                    "action": self.fallback_action,
