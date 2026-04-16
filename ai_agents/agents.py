from __future__ import annotations

from .base import AgentResult, ReviewContext
from .heuristics import (
    clean_code_recommendations,
    detect_common_bugs,
    detect_security_findings,
    generate_edge_cases,
    performance_recommendations,
    refactor_code,
    unit_tests_for,
)
from .llm import LLMClient
from .prompts import CODE_REVIEWER_PROMPT, FIX_SUGGESTION_PROMPT, SECURITY_PROMPT, TEST_GENERATOR_PROMPT


class BaseAgent:
    name = "base"

    def __init__(self, llm_client: LLMClient) -> None:
        self.llm_client = llm_client

    def _build_user_prompt(self, context: ReviewContext) -> str:
        return (
            f"Filename: {context.filename}\n"
            f"Language: {context.language}\n"
            f"Previous outputs: {context.prior_outputs}\n"
            f"Code:\n{context.code}"
        )


class CodeReviewerAgent(BaseAgent):
    name = "Code Reviewer Agent"

    def run(self, context: ReviewContext) -> AgentResult:
        llm_output = None
        if context.provider == "llm":
            llm_output = self.llm_client.generate_json(CODE_REVIEWER_PROMPT, self._build_user_prompt(context))
        if llm_output:
            return AgentResult(
                agent=self.name,
                summary=llm_output.get("summary", "LLM review completed."),
                findings=llm_output.get("findings", []),
                edge_cases=llm_output.get("edge_cases", []),
                recommendations=llm_output.get("recommendations", []),
            )
        findings = detect_common_bugs(context.code, context.language)
        recommendations = clean_code_recommendations(context.code) + performance_recommendations(context.code)
        return AgentResult(
            agent=self.name,
            summary="Heuristic code review completed.",
            findings=findings,
            edge_cases=generate_edge_cases(context.language),
            recommendations=recommendations,
        )


class SecurityAgent(BaseAgent):
    name = "Security Agent"

    def run(self, context: ReviewContext) -> AgentResult:
        llm_output = None
        if context.provider == "llm":
            llm_output = self.llm_client.generate_json(SECURITY_PROMPT, self._build_user_prompt(context))
        if llm_output:
            return AgentResult(
                agent=self.name,
                summary=llm_output.get("summary", "LLM security review completed."),
                findings=llm_output.get("findings", []),
                recommendations=llm_output.get("recommendations", []),
            )
        return AgentResult(
            agent=self.name,
            summary="Heuristic security review completed.",
            findings=detect_security_findings(context.code),
            recommendations=[
                "Validate and sanitize all external input.",
                "Prefer parameterized database access and output encoding.",
            ],
        )


class TestGeneratorAgent(BaseAgent):
    name = "Test Generator Agent"

    def run(self, context: ReviewContext) -> AgentResult:
        llm_output = None
        if context.provider == "llm":
            llm_output = self.llm_client.generate_json(TEST_GENERATOR_PROMPT, self._build_user_prompt(context))
        if llm_output:
            return AgentResult(
                agent=self.name,
                summary=llm_output.get("summary", "LLM test generation completed."),
                edge_cases=llm_output.get("edge_cases", []),
                unit_tests=llm_output.get("unit_tests", []),
            )
        return AgentResult(
            agent=self.name,
            summary="Heuristic test plan generated.",
            edge_cases=generate_edge_cases(context.language),
            unit_tests=unit_tests_for(context.language, context.filename),
        )


class FixSuggestionAgent(BaseAgent):
    name = "Fix Suggestion Agent"

    def run(self, context: ReviewContext) -> AgentResult:
        llm_output = None
        if context.provider == "llm":
            llm_output = self.llm_client.generate_json(FIX_SUGGESTION_PROMPT, self._build_user_prompt(context))
        if llm_output:
            return AgentResult(
                agent=self.name,
                summary=llm_output.get("summary", "LLM refactoring completed."),
                recommendations=llm_output.get("recommendations", []),
                refactored_code=llm_output.get("refactored_code", ""),
            )
        return AgentResult(
            agent=self.name,
            summary="Heuristic fix suggestions generated.",
            recommendations=clean_code_recommendations(context.code),
            refactored_code=refactor_code(context.code, context.language),
        )
