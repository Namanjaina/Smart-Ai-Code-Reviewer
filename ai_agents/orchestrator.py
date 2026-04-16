from __future__ import annotations

from dataclasses import asdict
from typing import Any

from .agents import CodeReviewerAgent, FixSuggestionAgent, SecurityAgent, TestGeneratorAgent
from .base import ReviewContext
from .llm import LLMClient


class ReviewOrchestrator:
    def __init__(self, provider: str, api_key: str | None, model: str, base_url: str | None = None) -> None:
        llm_client = LLMClient(api_key=api_key, model=model, base_url=base_url)
        self.provider = provider
        self.agents = [
            CodeReviewerAgent(llm_client),
            SecurityAgent(llm_client),
            TestGeneratorAgent(llm_client),
            FixSuggestionAgent(llm_client),
        ]

    def review(self, filename: str, language: str, code: str) -> dict[str, Any]:
        context = ReviewContext(filename=filename, language=language, code=code, provider=self.provider)
        outputs: list[dict[str, Any]] = []
        for agent in self.agents:
            result = agent.run(context)
            serialized = asdict(result)
            outputs.append(serialized)
            context.prior_outputs[agent.name] = serialized

        code_review = outputs[0]
        security_review = outputs[1]
        test_review = outputs[2]
        fix_review = outputs[3]

        bug_detection = [
            finding for finding in code_review["findings"] if finding.get("category") in {"bug", "performance", "clean_code"}
        ]
        security_findings = security_review["findings"]
        bug_detection = self._dedupe_findings(self._sort_findings(bug_detection))
        security_findings = self._dedupe_findings(self._sort_findings(security_findings))
        clean_code = list(dict.fromkeys(code_review["recommendations"] + fix_review["recommendations"]))
        performance = [
            finding["suggestion"]
            for finding in code_review["findings"]
            if finding.get("category") == "performance" and finding.get("suggestion")
        ]
        if not performance:
            performance = [item for item in code_review["recommendations"] if "performance" in item.lower() or "loop" in item.lower()]
        highest_severity = self._highest_severity(bug_detection + security_findings)
        verdict = {
            "high": "High-risk changes detected.",
            "medium": "Some review concerns should be addressed.",
            "low": "Only low-severity issues detected.",
            "none": "No concrete issues detected by the current analysis.",
        }[highest_severity]
        voice_explanation = (
            "Review complete. "
            f"I found {len(bug_detection)} general code findings and {len(security_findings)} security findings. "
            f"{verdict} Check the recommended unit tests and refactored code before merging."
        )
        return {
            "summary": f"{verdict} " + " ".join(output["summary"] for output in outputs if output["summary"]),
            "bug_detection": bug_detection,
            "edge_cases": list(dict.fromkeys(code_review["edge_cases"] + test_review["edge_cases"])),
            "security_vulnerabilities": security_findings,
            "performance_improvements": list(dict.fromkeys(performance)),
            "clean_code_suggestions": clean_code,
            "refactored_code": fix_review["refactored_code"] or code,
            "unit_test_cases": test_review["unit_tests"],
            "voice_explanation": voice_explanation,
            "agent_outputs": outputs,
        }

    @staticmethod
    def _sort_findings(findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
        order = {"high": 0, "medium": 1, "low": 2}
        return sorted(findings, key=lambda item: (order.get(item.get("severity", "low"), 3), item.get("line") or 10**9, item.get("title", "")))

    @staticmethod
    def _dedupe_findings(findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
        seen: set[tuple[Any, ...]] = set()
        unique: list[dict[str, Any]] = []
        for item in findings:
            key = (item.get("title"), item.get("line"), item.get("category"))
            if key in seen:
                continue
            seen.add(key)
            unique.append(item)
        return unique

    @staticmethod
    def _highest_severity(findings: list[dict[str, Any]]) -> str:
        severities = {item.get("severity", "low") for item in findings}
        if "high" in severities:
            return "high"
        if "medium" in severities:
            return "medium"
        if "low" in severities:
            return "low"
        return "none"
