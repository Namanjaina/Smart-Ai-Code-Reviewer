from __future__ import annotations

import re


SQLI_PATTERNS = [
    re.compile(r"SELECT.+\+.+FROM", re.IGNORECASE),
    re.compile(r"execute\s*\(\s*f[\"']", re.IGNORECASE),
    re.compile(r"query\s*=\s*[\"'].*\+.*[\"']", re.IGNORECASE),
    re.compile(r"query\s*=\s*f[\"']\s*SELECT", re.IGNORECASE),
]
XSS_PATTERNS = [
    re.compile(r"innerHTML\s*=", re.IGNORECASE),
    re.compile(r"document\.write\s*\(", re.IGNORECASE),
]
BUFFER_PATTERNS = [
    re.compile(r"\bstrcpy\s*\(", re.IGNORECASE),
    re.compile(r"\bgets\s*\(", re.IGNORECASE),
    re.compile(r"\bsprintf\s*\(", re.IGNORECASE),
]
SECRET_PATTERNS = [
    re.compile(r"api[_-]?key\s*=\s*[\"'][^\"']+[\"']", re.IGNORECASE),
    re.compile(r"secret\s*=\s*[\"'][^\"']+[\"']", re.IGNORECASE),
    re.compile(r"password\s*=\s*[\"'][^\"']+[\"']", re.IGNORECASE),
]


def _line_number(lines: list[str], predicate) -> int | None:
    for index, line in enumerate(lines, start=1):
        if predicate(line):
            return index
    return None


def detect_common_bugs(code: str, language: str) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    lines = code.splitlines()
    if "TODO" in code or "FIXME" in code:
        line = _line_number(lines, lambda current: "TODO" in current or "FIXME" in current)
        findings.append(
            {
                "severity": "medium",
                "category": "bug",
                "title": "Unresolved TODO/FIXME markers",
                "explanation": "The submitted code contains unfinished markers that often indicate incomplete logic.",
                "suggestion": "Resolve or remove TODO/FIXME markers before merging.",
                "line": line,
            }
        )
    if language == "python" and "except Exception" in code:
        line = _line_number(lines, lambda current: "except Exception" in current)
        findings.append(
            {
                "severity": "medium",
                "category": "bug",
                "title": "Broad exception handling",
                "explanation": "Catching Exception hides concrete failures and complicates debugging.",
                "suggestion": "Catch specific exception types and log actionable context.",
                "line": line,
            }
        )
    if language in {"javascript", "java"} and "==" in code and "===" not in code:
        line = _line_number(lines, lambda current: "==" in current and "===" not in current)
        findings.append(
            {
                "severity": "low",
                "category": "clean_code",
                "title": "Weak equality operator detected",
                "explanation": "Loose equality can produce coercion bugs.",
                "suggestion": "Use strict equality where applicable.",
                "line": line,
            }
        )
    if language in {"c", "cpp"} and "malloc(" in code and "free(" not in code:
        line = _line_number(lines, lambda current: "malloc(" in current)
        findings.append(
            {
                "severity": "high",
                "category": "bug",
                "title": "Possible memory leak",
                "explanation": "Allocated memory does not appear to be released.",
                "suggestion": "Ensure every successful allocation has a matching cleanup path.",
                "line": line,
            }
        )
    if "for (" in code and "for (" in code.split("for (", 1)[1]:
        line = _line_number(lines, lambda current: "for (" in current)
        findings.append(
            {
                "severity": "low",
                "category": "performance",
                "title": "Nested loops may become expensive",
                "explanation": "Nested iteration can degrade performance on larger inputs.",
                "suggestion": "Review algorithmic complexity and consider indexing or caching.",
                "line": line,
            }
        )
    return findings


def detect_security_findings(code: str) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    lines = code.splitlines()
    for pattern in SQLI_PATTERNS:
        if pattern.search(code):
            line = _line_number(lines, lambda current: bool(pattern.search(current)))
            findings.append(
                {
                    "severity": "high",
                    "category": "security",
                    "title": "Possible SQL injection",
                    "explanation": "Dynamic SQL appears to be built from string interpolation or concatenation.",
                    "suggestion": "Use parameterized queries or prepared statements.",
                    "line": line,
                }
            )
            break
    for pattern in XSS_PATTERNS:
        if pattern.search(code):
            line = _line_number(lines, lambda current: bool(pattern.search(current)))
            findings.append(
                {
                    "severity": "high",
                    "category": "security",
                    "title": "Possible XSS vector",
                    "explanation": "Unsafe DOM insertion is present and may render unsanitized input.",
                    "suggestion": "Escape user-controlled data and avoid `innerHTML` where possible.",
                    "line": line,
                }
            )
            break
    for pattern in BUFFER_PATTERNS:
        if pattern.search(code):
            line = _line_number(lines, lambda current: bool(pattern.search(current)))
            findings.append(
                {
                    "severity": "high",
                    "category": "security",
                    "title": "Unsafe C string handling",
                    "explanation": "Potential buffer overflow primitives were detected.",
                    "suggestion": "Use bounded alternatives such as `snprintf` or `strncpy` with care.",
                    "line": line,
                }
            )
            break
    for pattern in SECRET_PATTERNS:
        if pattern.search(code):
            line = _line_number(lines, lambda current: bool(pattern.search(current)))
            findings.append(
                {
                    "severity": "high",
                    "category": "security",
                    "title": "Hardcoded secret detected",
                    "explanation": "Credentials or tokens appear to be embedded directly in source code.",
                    "suggestion": "Move secrets to environment variables or a secret manager.",
                    "line": line,
                }
            )
            break
    return findings


def generate_edge_cases(language: str) -> list[str]:
    base_cases = [
        "Empty input or empty file content",
        "Null, None, undefined, or missing values",
        "Very large inputs that stress time and memory usage",
        "Malformed input that breaks parsing or validation",
    ]
    language_specific = {
        "python": ["Unexpected mutable default state", "Unicode input handling"],
        "javascript": ["Falsy values such as 0, '', false, null, and undefined", "Asynchronous failure paths"],
        "java": ["Null pointer scenarios", "Large collection iteration"],
        "c": ["Null pointer dereference", "Out-of-bounds memory access"],
        "cpp": ["Iterator invalidation", "Object lifetime and ownership issues"],
    }
    return base_cases + language_specific.get(language, [])


def clean_code_recommendations(code: str) -> list[str]:
    recommendations = [
        "Add input validation close to external boundaries.",
        "Prefer smaller functions with one clear responsibility.",
        "Replace magic values with named constants.",
    ]
    if len(code.splitlines()) > 40:
        recommendations.append("Split large functions or files into smaller composable units.")
    if "print(" in code or "console.log(" in code:
        recommendations.append("Replace debug logging with structured application logging.")
    return recommendations


def performance_recommendations(code: str) -> list[str]:
    recommendations = [
        "Review hotspots for repeated computation inside loops.",
        "Avoid unnecessary allocations and repeated string concatenation.",
    ]
    if "SELECT" in code.upper():
        recommendations.append("Ensure database access uses indexed columns and batched queries.")
    return recommendations


def refactor_code(code: str, language: str) -> str:
    header = {
        "python": "# Refactored version suggestion",
        "javascript": "// Refactored version suggestion",
        "java": "// Refactored version suggestion",
        "c": "/* Refactored version suggestion */",
        "cpp": "/* Refactored version suggestion */",
    }.get(language, "// Refactored version suggestion")
    return f"{header}\n{code}"


def unit_tests_for(language: str, filename: str) -> list[str]:
    if language == "python":
        return [
            f"Test `{filename}` with valid input and assert the expected return value.",
            f"Test `{filename}` with empty input and assert graceful handling.",
            f"Test `{filename}` with malformed input and assert a safe failure path.",
        ]
    if language == "javascript":
        return [
            f"Add a Jest test for `{filename}` covering success behavior.",
            f"Add a test for asynchronous rejection or invalid state transitions in `{filename}`.",
            f"Add a boundary-value test for empty and large payloads in `{filename}`.",
        ]
    if language == "java":
        return [
            f"Add a JUnit test for nominal behavior in `{filename}`.",
            f"Add a null-input test in `{filename}`.",
            f"Add a performance-oriented test for large collections in `{filename}`.",
        ]
    if language in {"c", "cpp"}:
        return [
            f"Add tests for valid input in `{filename}`.",
            f"Add tests for buffer boundaries and null pointers in `{filename}`.",
            f"Add tests for cleanup paths and repeated invocation in `{filename}`.",
        ]
    return [f"Add regression tests for `{filename}`."]
