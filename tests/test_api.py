import os
import unittest

os.environ["DATABASE_URL"] = "sqlite:///./tests_api.sqlite3"
os.environ["REVIEW_PROVIDER"] = "heuristic"

from fastapi.testclient import TestClient

from backend.app.core.config import get_settings
from backend.app.db.base import Base
from backend.app.db.session import get_engine
from backend.app.main import app

get_settings.cache_clear()
get_engine.cache_clear()


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        settings = get_settings()
        engine = get_engine(settings.database_url)
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    def test_health_endpoint(self) -> None:
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_create_review_endpoint(self) -> None:
        payload = {
            "filename": "unsafe.js",
            "language": "javascript",
            "provider": "heuristic",
            "code": "element.innerHTML = userInput; console.log(userInput);",
        }
        response = self.client.post("/api/v1/reviews", json=payload)

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["filename"], "unsafe.js")
        self.assertTrue(any(item["title"] == "Possible XSS vector" for item in data["security_vulnerabilities"]))
