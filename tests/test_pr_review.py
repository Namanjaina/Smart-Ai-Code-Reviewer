import unittest

from backend.scripts.pr_review import build_line_map, collect_inline_comments


class PrReviewTests(unittest.TestCase):
    def test_collect_inline_comments_uses_changed_lines(self) -> None:
        review = {
            "security_vulnerabilities": [
                {
                    "severity": "high",
                    "category": "security",
                    "title": "Possible SQL injection",
                    "explanation": "Dynamic SQL detected.",
                    "suggestion": "Use parameterized queries.",
                    "line": 3,
                }
            ],
            "bug_detection": [],
        }

        comments = collect_inline_comments("src/app.py", review, {"src/app.py": {3, 4}})

        self.assertEqual(len(comments), 1)
        self.assertEqual(comments[0]["line"], 3)
        self.assertEqual(comments[0]["path"], "src/app.py")

    def test_build_line_map_parses_unified_zero_diff(self) -> None:
        diff_text = "\n".join(
            [
                "diff --git a/src/app.py b/src/app.py",
                "index 1111111..2222222 100644",
                "--- a/src/app.py",
                "+++ b/src/app.py",
                "@@ -2,0 +3,2 @@",
                "+danger()",
                "+run()",
            ]
        )

        from backend.scripts import pr_review

        original = pr_review.run_git
        try:
            pr_review.run_git = lambda args: diff_text
            mapping = build_line_map("base", "head")
        finally:
            pr_review.run_git = original

        self.assertEqual(mapping["src/app.py"], {3, 4})
