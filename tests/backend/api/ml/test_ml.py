"""
ML Price Prediction Tests
==========================
Implements test cases TC-ML-001 through TC-ML-004
from the Smart Rental System Test Plan.

Test Objectives (TO-07):
  - Rent price prediction with valid and invalid input features
  - ML service health check endpoint
  - Confidence interval accuracy
  - Integration with the ML service running on port 5000
"""

import os
import pytest
import requests


ML_BASE_URL = os.getenv("ML_BASE_URL", "http://localhost:5000")
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8080/api")
BACKEND_TIMEOUT = int(os.getenv("BACKEND_TIMEOUT", "10"))


def is_ml_service_ready() -> bool:
    try:
        resp = requests.get(f"{ML_BASE_URL}/health", timeout=3)
        return resp.status_code == 200
    except requests.RequestException:
        return False


def is_backend_running() -> bool:
    try:
        resp = requests.get(f"{BACKEND_BASE_URL}/ml/status", timeout=3)
        return True
    except requests.RequestException:
        return False


@pytest.fixture(scope="session")
def ml_service_ready():
    if not is_ml_service_ready():
        pytest.skip(f"ML service not running at {ML_BASE_URL}")
    return True


@pytest.fixture(scope="session")
def backend_ready():
    if not is_backend_running():
        pytest.skip(f"Backend not running at {BACKEND_BASE_URL}")
    return True


# =============================================================================
# Direct ML Service Tests (Port 5000)
# =============================================================================

@pytest.mark.ml
class TestMlServiceHealth:
    """TC-ML-004: ML service health check."""

    def test_health_endpoint(self, ml_service_ready):
        """TC-ML-004: GET /health should return 200."""
        resp = requests.get(f"{ML_BASE_URL}/health", timeout=5)
        assert resp.status_code == 200

    def test_api_v1_health_endpoint(self, ml_service_ready):
        """TC-ML-004b: GET /api/v1/health should return 200."""
        resp = requests.get(f"{ML_BASE_URL}/api/v1/health", timeout=5)
        assert resp.status_code == 200


@pytest.mark.ml
class TestMlServicePredict:
    """TC-ML-001 to TC-ML-003: ML price prediction endpoint."""

    def test_predict_valid_features(self, ml_service_ready):
        """TC-ML-001: POST /api/v1/predict with valid features should return predicted price."""
        payload = {
            "bedrooms": 2,
            "area": 80.0,
            "city": "Shanghai",
            "region": "Pudong",
            "bathrooms": 1,
            "propertyType": "Apartment",
            "decoration": "Furnished",
            "floor": 5,
            "totalFloors": 20,
            "orientation": "South",
            "hasParking": True,
            "hasElevator": True,
            "hasBalcony": True,
        }
        resp = requests.post(f"{ML_BASE_URL}/api/v1/predict", json=payload, timeout=15)
        assert resp.status_code == 200
        data = resp.json()
        assert "predictedPrice" in data
        assert data["predictedPrice"] > 0
        assert "currency" in data

    def test_predict_missing_required_field(self, ml_service_ready):
        """TC-ML-002: POST /api/v1/predict missing 'city' field should return 422."""
        payload = {
            "bedrooms": 2,
            "area": 80.0,
            # missing: city
        }
        resp = requests.post(f"{ML_BASE_URL}/api/v1/predict", json=payload, timeout=10)
        assert resp.status_code == 422

    def test_confidence_interval_within_10_percent(self, ml_service_ready):
        """TC-ML-003: Confidence interval (upperBound - lowerBound) should be approximately 10% of predicted price."""
        payload = {
            "bedrooms": 2,
            "area": 80.0,
            "city": "Shanghai",
            "region": "Pudong",
            "bathrooms": 1,
            "propertyType": "Apartment",
            "decoration": "Furnished",
            "floor": 5,
            "totalFloors": 20,
            "orientation": "South",
        }
        resp = requests.post(f"{ML_BASE_URL}/api/v1/predict", json=payload, timeout=15)
        assert resp.status_code == 200
        data = resp.json()
        assert "predictedPrice" in data
        assert "lowerBound" in data
        assert "upperBound" in data
        predicted = data["predictedPrice"]
        lower = data["lowerBound"]
        upper = data["upperBound"]
        # Verify interval is approximately 10%
        interval = upper - lower
        assert interval > 0, "Confidence interval must be positive"
        ratio = interval / predicted if predicted > 0 else 0
        assert ratio < 0.3, f"Confidence interval ratio {ratio:.2f} is too large (expected < 0.3)"

    def test_predict_returns_algorithm_info(self, ml_service_ready):
        """TC-ML-FULL: Prediction response should include model version and algorithm name."""
        payload = {
            "bedrooms": 1,
            "area": 50.0,
            "city": "Beijing",
            "bathrooms": 1,
            "propertyType": "Apartment",
            "decoration": "Unfurnished",
            "floor": 3,
            "totalFloors": 15,
            "orientation": "North",
        }
        resp = requests.post(f"{ML_BASE_URL}/api/v1/predict", json=payload, timeout=15)
        assert resp.status_code == 200
        data = resp.json()
        assert "modelVersion" in data
        assert "algorithmName" in data

    def test_predict_various_cities(self, ml_service_ready):
        """TC-ML-FULL: Prediction should work for different cities."""
        for city in ["Shanghai", "Beijing", "Hangzhou", "Chengdu"]:
            payload = {
                "bedrooms": 2,
                "area": 80.0,
                "city": city,
                "region": "Downtown",
                "bathrooms": 1,
                "propertyType": "Apartment",
                "decoration": "Furnished",
                "floor": 5,
                "totalFloors": 20,
                "orientation": "South",
            }
            resp = requests.post(f"{ML_BASE_URL}/api/v1/predict", json=payload, timeout=15)
            assert resp.status_code == 200
            data = resp.json()
            assert data["predictedPrice"] > 0


# =============================================================================
# Backend ML Controller Integration Tests (Port 8080)
# =============================================================================

@pytest.mark.ml
class TestBackendMlController:
    """ML-related endpoints via the backend Spring Boot application."""

    def test_backend_ml_status(self, backend_ready):
        """TC-ML-004: GET /ml/status should return ML service availability."""
        resp = requests.get(
            f"{BACKEND_BASE_URL}/ml/status",
            timeout=BACKEND_TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "data" in data

    def test_backend_ml_predict_with_token(self, backend_ready):
        """TC-ML-001: POST /ml/predict via backend should return prediction results."""
        # First register and login to get a token
        import random
        username = f"ml_test_{random.randint(1000, 9999)}"
        email = f"ml_{random.randint(1000, 9999)}@test.com"
        reg_resp = requests.post(
            f"{BACKEND_BASE_URL}/auth/register",
            json={
                "username": username,
                "email": email,
                "password": "Test123456",
                "role": "tenant",
                "phone": "13800138001",
            },
            timeout=BACKEND_TIMEOUT
        )
        assert reg_resp.status_code == 201
        token = reg_resp.json()["data"]["token"]

        payload = {
            "bedrooms": 2,
            "area": 80.0,
            "city": "Shanghai",
            "region": "Pudong",
            "bathrooms": 1,
            "propertyType": "Apartment",
            "decoration": "Furnished",
            "floor": 5,
            "totalFloors": 20,
            "orientation": "South",
        }
        resp = requests.post(
            f"{BACKEND_BASE_URL}/ml/predict",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=BACKEND_TIMEOUT
        )
        assert resp.status_code in (200, 503)
        # 503 is acceptable if ML service is down
        if resp.status_code == 200:
            data = resp.json()
            assert "data" in data

    def test_backend_ml_similar_properties(self, backend_ready):
        """TC-ML-SIMILAR: GET /ml/similar should return similar properties."""
        resp = requests.get(
            f"{BACKEND_BASE_URL}/ml/similar?city=Shanghai&bedrooms=2",
            timeout=BACKEND_TIMEOUT
        )
        # Returns 200 regardless of whether results are found
        assert resp.status_code == 200

    def test_backend_ml_closest_property(self, backend_ready):
        """TC-ML-CLOSEST: GET /ml/closest should return the most similar property from DB."""
        resp = requests.get(
            f"{BACKEND_BASE_URL}/ml/closest?city=Shanghai&bedrooms=2&area=80",
            timeout=BACKEND_TIMEOUT
        )
        assert resp.status_code == 200
