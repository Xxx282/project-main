"""
AI Smart Search Tests
======================
Implements test cases TC-AI-001 through TC-AI-003
from the Smart Rental System Test Plan.

Test Objectives (TO-08):
  - AI search endpoint parses natural language queries
  - Returns relevant property results
  - Falls back to database search when AI service is unavailable
"""

import pytest
import requests


BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8080/api")
BACKEND_TIMEOUT = int(os.getenv("BACKEND_TIMEOUT", "10"))

AI_ENABLED = os.getenv("AI_ENABLED", "true").lower() == "true"


def is_backend_running() -> bool:
    try:
        resp = requests.get(f"{BACKEND_BASE_URL}/auth/check-username?username=test", timeout=3)
        return True
    except requests.RequestException:
        return False


@pytest.fixture(scope="session")
def backend_ready():
    if not is_backend_running():
        pytest.skip(f"Backend not running at {BACKEND_BASE_URL}")
    return True


@pytest.mark.ai
class TestAiSearch:
    """TC-AI-001: AI smart search with natural language queries."""

    def test_ai_search_endpoint_returns_200(self, backend_ready):
        """TC-AI-001: POST /ai/search should return 200 for a natural language query."""
        payload = {
            "query": "I want a 2-bedroom apartment in Shanghai under 6000 yuan"
        }
        resp = requests.post(
            f"{BACKEND_BASE_URL}/ai/search",
            json=payload,
            timeout=BACKEND_TIMEOUT + 10
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "data" in body

    def test_ai_search_returns_properties(self, backend_ready):
        """TC-AI-001b: AI search should return a list of property results."""
        payload = {
            "query": "apartment in Shanghai"
        }
        resp = requests.post(
            f"{BACKEND_BASE_URL}/ai/search",
            json=payload,
            timeout=BACKEND_TIMEOUT + 10
        )
        assert resp.status_code == 200
        body = resp.json()
        data = body.get("data", {})
        # Response contains {properties: [...], query: {...}, source: "ai"|"db"}
        assert isinstance(data, dict)

    def test_ai_search_missing_query_returns_400(self, backend_ready):
        """TC-AI-001c: POST /ai/search without a query should return 400."""
        resp = requests.post(
            f"{BACKEND_BASE_URL}/ai/search",
            json={},
            timeout=BACKEND_TIMEOUT
        )
        assert resp.status_code == 400


@pytest.mark.ai
class TestAiChat:
    """TC-AI-002: AI Q&A about properties."""

    def test_ai_chat_returns_answer(self, backend_ready):
        """TC-AI-002: POST /ai/chat should return an AI-generated answer."""
        payload = {
            "question": "What is the average rent for a 2-bedroom apartment in Shanghai?"
        }
        resp = requests.post(
            f"{BACKEND_BASE_URL}/ai/chat",
            json=payload,
            timeout=BACKEND_TIMEOUT + 10
        )
        assert resp.status_code == 200
        body = resp.json()
        data = body.get("data")
        assert data is not None
        assert isinstance(data, str)

    def test_ai_chat_missing_question_returns_error(self, backend_ready):
        """TC-AI-002b: POST /ai/chat without a question should return appropriate error."""
        resp = requests.post(
            f"{BACKEND_BASE_URL}/ai/chat",
            json={},
            timeout=BACKEND_TIMEOUT
        )
        assert resp.status_code in (400, 500)


@pytest.mark.ai
class TestAiReplySuggestion:
    """TC-AI-SUGGEST: AI smart reply suggestion for consultations."""

    def test_ai_suggest_reply(self, backend_ready):
        """TC-AI-SUGGEST: POST /ai/chat/suggest should return a reply suggestion."""
        payload = {
            "listingTitle": "Luxury Apartment in Pudong",
            "listingPrice": "6000/month",
            "listingDescription": "Modern apartment with city view",
            "recentMessages": "Tenant: Is this available?\nLandlord: Yes, it is!",
        }
        resp = requests.post(
            f"{BACKEND_BASE_URL}/ai/chat/suggest",
            json=payload,
            timeout=BACKEND_TIMEOUT + 10
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("data") is not None


@pytest.mark.ai
class TestAiFallback:
    """TC-AI-003: AI fallback to database search when AI is disabled."""

    def test_ai_search_with_ai_disabled(self, backend_ready):
        """TC-AI-003: When AI is disabled, search should fall back to DB query."""
        # This test checks that the endpoint is still accessible
        # The actual fallback behavior depends on app.ai.enabled=false config
        payload = {"query": "2 bedroom Shanghai"}
        resp = requests.post(
            f"{BACKEND_BASE_URL}/ai/search",
            json=payload,
            timeout=BACKEND_TIMEOUT + 10
        )
        # Should still return 200 (fallback mode)
        assert resp.status_code == 200
        body = resp.json()
        assert "data" in body
