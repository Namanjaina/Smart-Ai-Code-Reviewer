from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class ReviewContext:
    filename: str
    language: str
    code: str
    provider: str = "heuristic"
    prior_outputs: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class AgentResult:
    agent: str
    summary: str
    findings: list[dict[str, str]] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)
    edge_cases: list[str] = field(default_factory=list)
    unit_tests: list[str] = field(default_factory=list)
    refactored_code: str = ""
