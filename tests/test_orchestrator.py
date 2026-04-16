import unittest

from ai_agents.orchestrator import ReviewOrchestrator


class OrchestratorTests(unittest.TestCase):
    def test_heuristic_review_returns_all_sections(self) -> None:
        orchestrator = ReviewOrchestrator(provider="heuristic", api_key=None, model="test-model")
        code = """
def fetch(cursor, user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    print(query)
    return cursor.execute(query)
"""
        result = orchestrator.review(filename="app.py", language="python", code=code)

        self.assertIn("bug_detection", result)
        self.assertIn("security_vulnerabilities", result)
        self.assertIn("unit_test_cases", result)
        self.assertGreaterEqual(len(result["agent_outputs"]), 4)
        self.assertTrue(any(item["title"] == "Possible SQL injection" for item in result["security_vulnerabilities"]))
