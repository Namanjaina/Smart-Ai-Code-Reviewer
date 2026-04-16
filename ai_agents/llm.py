from __future__ import annotations

import json
from typing import Any


class LLMClient:
    def __init__(self, api_key: str | None, model: str, base_url: str | None = None) -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = base_url

    def enabled(self) -> bool:
        return bool(self.api_key)

    def generate_json(self, system_prompt: str, user_prompt: str) -> dict[str, Any] | None:
        if not self.enabled():
            return None
        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            from langchain_openai import ChatOpenAI
        except ImportError:
            return None

        kwargs: dict[str, Any] = {"api_key": self.api_key, "model": self.model}
        if self.base_url:
            kwargs["base_url"] = self.base_url

        llm = ChatOpenAI(**kwargs)
        response = llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(
                    content=(
                        f"{user_prompt}\n\n"
                        "Return valid JSON only. Do not wrap it in markdown fences."
                    )
                ),
            ]
        )
        content = response.content if isinstance(response.content, str) else "{}"
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return None
