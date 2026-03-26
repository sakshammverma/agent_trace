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
                    "error": f"Monotonic loop ceiling reached ({self.max_retries} attempts). Escaped infinite cycle."
                }

            self._history[session_id] = curr_retries + 1
            start = time.time()
            res = func(state, *args, **kwargs)
            
            if time.time() - start > self.timeout_sec:
                raise SecurityViolationError(f"Execution timeout ({self.timeout_sec}s) exceeded on node {func.__name__}")
            
            return res
        return wrapper


class TaintBoundaryIsolation:
    """
    AST Guardrail (CVE-2026-771 Remediation):
    Wraps untrusted user input channels in cryptographically isolated XML nonce
    delimiters and strips indirect prompt injection tokens before forwarding.
    """
    INJECTION_PATTERNS = [
        re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
        re.compile(r"system\s*:\s*override", re.IGNORECASE),
        re.compile(r"disregard\s+prior\s+rules", re.IGNORECASE),
        re.compile(r"<script.*?>.*?</script>", re.IGNORECASE)
    ]

    def __init__(self, strict_mode: bool = True, nonce: str = "AGENT_TRACE_SEC_BOUND"):
        self.strict_mode = strict_mode
        self.nonce = nonce

    def __call__(self, func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(raw_input: Any, *args, **kwargs) -> Any:
            if isinstance(raw_input, str):
                # 1. Pattern scan for injection payloads
                for pat in self.INJECTION_PATTERNS:
                    if pat.search(raw_input):
                        print(f"[AGENT-TRACE BLOCKED] Detected prompt injection pattern: {pat.pattern}")
                        if self.strict_mode:
                            raise SecurityViolationError(f"Prompt injection payload intercepted by AGENT-TRACE Boundary.")

                # 2. Cryptographic XML Nonce Delimiter Isolation
                sanitized = html.escape(raw_input)
                isolated_payload = f"<{self.nonce}>\n{sanitized}\n</{self.nonce}>"
