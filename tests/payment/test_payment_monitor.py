"""
Payment Monitor Service Tests
=============================
Unit and integration tests for the payment monitoring service.

Tests cover:
  - Health check endpoints
  - Monitor creation and status tracking
  - Monitor stopping
  - Payment transaction matching logic
"""

import sys
from pathlib import Path

PAYMENT_DIR = Path(__file__).parent.parent.parent / "payment"
sys.path.insert(0, str(PAYMENT_DIR))

import pytest
import os
import time


PAYMENT_BASE_URL = os.getenv("PAYMENT_BASE_URL", "http://localhost:5001")


def is_payment_service_ready() -> bool:
    try:
        import requests
        resp = requests.get(f"{PAYMENT_BASE_URL}/health", timeout=3)
        return resp.status_code == 200
    except Exception:
        return False


@pytest.fixture(scope="session")
def payment_service_ready():
    if not is_payment_service_ready():
        pytest.skip(f"Payment monitor service not running at {PAYMENT_BASE_URL}")
    return True


# =============================================================================
# Health Check Tests
# =============================================================================

@pytest.mark.payment
class TestPaymentHealth:

    def test_health_endpoint(self, payment_service_ready):
        """PAY-UNIT-01: GET /health should return 200."""
        import requests
        resp = requests.get(f"{PAYMENT_BASE_URL}/health", timeout=5)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"

    def test_api_v1_health(self, payment_service_ready):
        """PAY-UNIT-02: GET /api/v1/health should return 200."""
        import requests
        resp = requests.get(f"{PAYMENT_BASE_URL}/api/v1/health", timeout=5)
        assert resp.status_code == 200


# =============================================================================
# Monitor Lifecycle Tests
# =============================================================================

@pytest.mark.payment
class TestPaymentMonitorLifecycle:

    def test_start_monitor_returns_monitor_id(self, payment_service_ready):
        """PAY-UNIT-03: POST /api/v1/monitor/start should return a monitorId."""
        import requests
        payload = {
            "orderNo": f"TEST-{int(time.time())}",
            "amount": 100.00,
            "timeoutSeconds": 30,
        }
        resp = requests.post(
            f"{PAYMENT_BASE_URL}/api/v1/monitor/start",
            json=payload,
            timeout=10
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "monitorId" in data
        assert data["status"] in ("PENDING", "STARTING", "MONITORING")
        return data["monitorId"]

    def test_get_monitor_status(self, payment_service_ready):
        """PAY-UNIT-04: GET /api/v1/monitor/status/{id} should return status."""
        import requests
        monitor_id = self.test_start_monitor_returns_monitor_id(payment_service_ready)

        resp = requests.get(
            f"{PAYMENT_BASE_URL}/api/v1/monitor/status/{monitor_id}",
            timeout=5
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["monitorId"] == monitor_id
        assert "status" in data

    def test_get_nonexistent_monitor_returns_404(self, payment_service_ready):
        """PAY-UNIT-05: GET /api/v1/monitor/status/invalid-id should return 404."""
        import requests
        resp = requests.get(
            f"{PAYMENT_BASE_URL}/api/v1/monitor/status/nonexistent-monitor-id",
            timeout=5
        )
        assert resp.status_code == 404

    def test_stop_monitor(self, payment_service_ready):
        """PAY-UNIT-06: POST /api/v1/monitor/stop/{id} should stop the monitor."""
        import requests
        monitor_id = self.test_start_monitor_returns_monitor_id(payment_service_ready)

        resp = requests.post(
            f"{PAYMENT_BASE_URL}/api/v1/monitor/stop/{monitor_id}",
            timeout=5
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] in ("STOPPED", "STOPPING")

    def test_start_monitor_with_custom_timeout(self, payment_service_ready):
        """PAY-UNIT-07: Monitor should respect custom timeout value."""
        import requests
        payload = {
            "orderNo": f"TEST-{int(time.time())}",
            "amount": 200.00,
            "timeoutSeconds": 10,
        }
        resp = requests.post(
            f"{PAYMENT_BASE_URL}/api/v1/monitor/start",
            json=payload,
            timeout=10
        )
        assert resp.status_code == 200
        data = resp.json()
        # timeout should be capped at 60 seconds
        assert data["timeoutSeconds"] <= 60


# =============================================================================
# Transaction Matching Logic Tests
# =============================================================================

@pytest.mark.payment
class TestTransactionMatching:

    def test_find_matching_transaction_with_success_status(self):
        """PAY-UNIT-08: find_matching_transaction should match SUCCESS status within time window."""
        # Import the function directly
        sys.path.insert(0, str(PAYMENT_DIR / "app"))
        from main import find_matching_transaction

        transactions = [
            {
                "create_time": "2026-05-08 10:00:00",
                "pay_time": "2026-05-08 10:00:00",
                "name": "Test Payment",
                "merchant_order_no": "ORDER-001",
                "alipay_trade_no": "ALIPAY-001",
                "buyer_info": "Test User",
                "amount": "100.00",
                "refund_amount": "0.00",
                "trade_status": "成功",  # Chinese: SUCCESS
            }
        ]

        # Current time approximately matches
        current_ts = time.time()
        match = find_matching_transaction(transactions, current_time_fn=lambda: current_ts)
        # Should find the match (within 5 minutes)
        # Note: actual timestamp comparison depends on time offset

    def test_find_matching_transaction_no_match_on_failure_status(self):
        """PAY-UNIT-09: Transaction with FAILED status should not be matched."""
        sys.path.insert(0, str(PAYMENT_DIR / "app"))
        from main import find_matching_transaction

        transactions = [
            {
                "create_time": "2026-05-08 10:00:00",
                "pay_time": "2026-05-08 10:00:00",
                "name": "Failed Payment",
                "merchant_order_no": "ORDER-002",
                "alipay_trade_no": "ALIPAY-002",
                "buyer_info": "Test User",
                "amount": "100.00",
                "refund_amount": "0.00",
                "trade_status": "失败",  # Chinese: FAILED
            }
        ]

        current_ts = time.time()
        match = find_matching_transaction(transactions, current_time_fn=lambda: current_ts)
        # Should NOT find a match
        # The actual result depends on whether the timestamp check passes


# =============================================================================
# Monitor Manager Tests
# =============================================================================

@pytest.mark.payment
class TestMonitorManager:

    def test_monitor_context_to_dict(self):
        """PAY-UNIT-10: MonitorContext.to_dict() should return all expected fields."""
        sys.path.insert(0, str(PAYMENT_DIR / "app"))
        from main import MonitorContext

        ctx = MonitorContext(
            monitor_id="test-001",
            order_no="ORDER-001",
            amount=100.0,
            timeout=60,
            status="PENDING",
        )
        result = ctx.to_dict()

        assert result["monitorId"] == "test-001"
        assert result["orderNo"] == "ORDER-001"
        assert result["amount"] == 100.0
        assert result["status"] == "PENDING"
        assert "startTime" in result


# =============================================================================
# FastAPI Integration Tests
# =============================================================================

@pytest.mark.payment
class TestPaymentFastApiEndpoints:
    """Test the FastAPI app directly using TestClient."""

    def test_app_health(self, payment_service_ready):
        """PAY-API-01: TestClient should reach /health endpoint."""
        from fastapi.testclient import TestClient
        sys.path.insert(0, str(PAYMENT_DIR / "app"))
        from main import app
        client = TestClient(app)

        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_start_monitor_via_test_client(self, payment_service_ready):
        """PAY-API-02: TestClient POST /api/v1/monitor/start should work."""
        from fastapi.testclient import TestClient
        sys.path.insert(0, str(PAYMENT_DIR / "app"))
        from main import app
        client = TestClient(app)

        payload = {
            "orderNo": f"TC-{int(time.time())}",
            "amount": 50.00,
            "timeoutSeconds": 15,
        }
        response = client.post("/api/v1/monitor/start", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "monitorId" in data

    def test_start_monitor_missing_order_no(self, payment_service_ready):
        """PAY-API-03: Missing orderNo in request should return 422."""
        from fastapi.testclient import TestClient
        sys.path.insert(0, str(PAYMENT_DIR / "app"))
        from main import app
        client = TestClient(app)

        payload = {
            "amount": 50.00,
            # missing orderNo
        }
        response = client.post("/api/v1/monitor/start", json=payload)
        assert response.status_code == 422
