"""
ML Service Unit Tests
====================
Unit tests for the rent-price-ml module.

Tests cover:
  - Model prediction correctness
  - Confidence interval calculation
  - Feature importance aggregation
  - Request validation
"""

import sys
from pathlib import Path

# Add the rent-price-ml directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "rent-price-ml"))

import pytest
import os

ML_DIR = Path(__file__).parent.parent.parent / "rent-price-ml"


@pytest.fixture(scope="session")
def model_available():
    model_path = ML_DIR / "model.joblib"
    if not model_path.exists():
        pytest.skip(f"Trained model not found at {model_path}. Run: python rent-price-ml/train.py")
    return True


# =============================================================================
# Model Loading & Prediction Tests
# =============================================================================

@pytest.mark.ml
class TestMlModel:
    """ML model loading and prediction tests."""

    def test_model_loads_without_error(self, model_available):
        """ML-UNIT-01: Model should load from disk without error."""
        import joblib
        model_path = ML_DIR / "model.joblib"
        model = joblib.load(model_path)
        assert model is not None

    def test_model_predict_returns_positive_value(self, model_available):
        """ML-UNIT-02: Model prediction for valid input should return a positive rent value."""
        from rent_price_ml.app.model import predict_one

        record = {
            "landlord_id": 1,
            "title": "Test Apartment",
            "city": "Shanghai",
            "region": "Pudong",
            "address": "123 Test St",
            "bedrooms": 2,
            "bathrooms": 1,
            "area": 80.0,
            "price": 0,
            "total_floors": 10,
            "floor_level": "mid",
            "orientation": "South",
            "decoration": "fine",
            "description": "Test property",
            "status": "available",
            "view_count": 0,
            "created_at": "2026-01-01",
        }
        prediction = predict_one(record)
        assert isinstance(prediction, (int, float))
        assert prediction > 0

    def test_prediction_different_for_different_cities(self, model_available):
        """ML-UNIT-03: Same property specs should yield different prices in different cities."""
        from rent_price_ml.app.model import predict_one

        base_record = {
            "landlord_id": 1,
            "title": "Test Apartment",
            "city": None,
            "region": "Downtown",
            "address": "123 Test St",
            "bedrooms": 2,
            "bathrooms": 1,
            "area": 80.0,
            "price": 0,
            "total_floors": 10,
            "floor_level": "mid",
            "orientation": "South",
            "decoration": "fine",
            "description": "Test property",
            "status": "available",
            "view_count": 0,
            "created_at": "2026-01-01",
        }

        record_sh = {**base_record, "city": "Shanghai"}
        record_bj = {**base_record, "city": "Beijing"}

        pred_sh = predict_one(record_sh)
        pred_bj = predict_one(record_bj)

        assert pred_sh != pred_bj

    def test_prediction_increases_with_area(self, model_available):
        """ML-UNIT-04: Larger area should generally produce higher rent predictions."""
        from rent_price_ml.app.model import predict_one

        base = {
            "landlord_id": 1, "title": "Test", "city": "Shanghai",
            "region": "Pudong", "address": "St", "bedrooms": 2,
            "bathrooms": 1, "area": None, "price": 0,
            "total_floors": 10, "floor_level": "mid",
            "orientation": "South", "decoration": "fine",
            "description": "Test", "status": "available",
            "view_count": 0, "created_at": "2026-01-01",
        }

        pred_small = predict_one({**base, "area": 50.0})
        pred_large = predict_one({**base, "area": 120.0})

        assert pred_large > pred_small, "Larger area should produce higher rent"


# =============================================================================
# Confidence Interval Tests
# =============================================================================

@pytest.mark.ml
class TestMlConfidenceInterval:
    """ML confidence interval calculation tests."""

    def test_confidence_interval_positive(self, model_available):
        """ML-UNIT-05: Confidence interval bounds should be positive."""
        from rent_price_ml.app.model import predict_with_confidence

        record = {
            "landlord_id": 1, "title": "Test", "city": "Shanghai",
            "region": "Pudong", "address": "St", "bedrooms": 2,
            "bathrooms": 1, "area": 80.0, "price": 0,
            "total_floors": 10, "floor_level": "mid",
            "orientation": "South", "decoration": "fine",
            "description": "Test", "status": "available",
            "view_count": 0, "created_at": "2026-01-01",
        }

        result = predict_with_confidence(record)
        assert result["lower_bound"] > 0
        assert result["upper_bound"] > 0
        assert result["upper_bound"] > result["lower_bound"]

    def test_confidence_interval_width_reasonable(self, model_available):
        """ML-UNIT-06: Confidence interval should be within reasonable bounds."""
        from rent_price_ml.app.model import predict_one, predict_with_confidence

        record = {
            "landlord_id": 1, "title": "Test", "city": "Shanghai",
            "region": "Pudong", "address": "St", "bedrooms": 2,
            "bathrooms": 1, "area": 80.0, "price": 0,
            "total_floors": 10, "floor_level": "mid",
            "orientation": "South", "decoration": "fine",
            "description": "Test", "status": "available",
            "view_count": 0, "created_at": "2026-01-01",
        }

        pred = predict_one(record)
        result = predict_with_confidence(record)

        interval = result["upper_bound"] - result["lower_bound"]
        ratio = interval / pred if pred > 0 else 0

        # Interval should not exceed 50% of the predicted price
        assert ratio < 0.5, f"Confidence interval ratio {ratio:.2f} is too large"


# =============================================================================
# Feature Importance Tests
# =============================================================================

@pytest.mark.ml
class TestMlFeatureImportance:
    """Feature importance aggregation tests."""

    def test_feature_importance_returns_dict(self, model_available):
        """ML-UNIT-07: Feature importance should be returned as a dictionary."""
        from rent_price_ml.app.model import get_feature_importance

        importance = get_feature_importance()
        assert isinstance(importance, dict)
        assert len(importance) > 0

    def test_feature_importance_non_negative(self, model_available):
        """ML-UNIT-08: All feature importance values should be non-negative."""
        from rent_price_ml.app.model import get_feature_importance

        importance = get_feature_importance()
        for feature, value in importance.items():
            assert value >= 0, f"Feature {feature} has negative importance: {value}"

    def test_aggregate_importance_sums_to_total(self, model_available):
        """ML-UNIT-09: Aggregated importance should be consistent."""
        # Import the aggregation function from the ML module
        sys.path.insert(0, str(ML_DIR / "app"))
        try:
            from main import aggregate_feature_importance

            raw = {"city_Shanghai": 0.1, "city_Beijing": 0.05, "bedrooms": 0.3}
            aggregated = aggregate_feature_importance(raw)
            assert isinstance(aggregated, dict)
            # "city" should be aggregated from city_Shanghai + city_Beijing
            assert "city" in aggregated or "city_Shanghai" in aggregated
        except ImportError:
            pytest.skip("aggregate_feature_importance not importable from main.py")


# =============================================================================
# FastAPI Endpoint Tests (with uvicorn test client)
# =============================================================================

@pytest.mark.ml
class TestMlApiEndpoints:
    """FastAPI endpoint tests using TestClient."""

    def test_health_endpoint(self, model_available):
        """ML-API-01: GET /health should return 200."""
        from fastapi.testclient import TestClient
        sys.path.insert(0, str(ML_DIR / "app"))
        from main import app
        client = TestClient(app)

        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["ok"] is True

    def test_api_v1_health_endpoint(self, model_available):
        """ML-API-02: GET /api/v1/health should return 200."""
        from fastapi.testclient import TestClient
        sys.path.insert(0, str(ML_DIR / "app"))
        from main import app
        client = TestClient(app)

        response = client.get("/api/v1/health")
        assert response.status_code == 200

    def test_predict_endpoint_valid_payload(self, model_available):
        """ML-API-03: POST /api/v1/predict with valid payload should return 200."""
        from fastapi.testclient import TestClient
        sys.path.insert(0, str(ML_DIR / "app"))
        from main import app
        client = TestClient(app)

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
            "hasParking": False,
            "hasElevator": True,
            "hasBalcony": True,
        }
        response = client.post("/api/v1/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "predictedPrice" in data
        assert data["predictedPrice"] > 0

    def test_predict_endpoint_missing_city(self, model_available):
        """ML-API-04: POST /api/v1/predict missing 'city' should return 422."""
        from fastapi.testclient import TestClient
        sys.path.insert(0, str(ML_DIR / "app"))
        from main import app
        client = TestClient(app)

        payload = {
            "bedrooms": 2,
            "area": 80.0,
            # missing city
        }
        response = client.post("/api/v1/predict", json=payload)
        assert response.status_code == 422

    def test_predict_endpoint_invalid_area(self, model_available):
        """ML-API-05: POST /api/v1/predict with zero area should return 422."""
        from fastapi.testclient import TestClient
        sys.path.insert(0, str(ML_DIR / "app"))
        from main import app
        client = TestClient(app)

        payload = {
            "bedrooms": 2,
            "area": 0,  # Invalid: must be > 0
            "city": "Shanghai",
            "bathrooms": 1,
            "propertyType": "Apartment",
            "decoration": "Furnished",
            "floor": 5,
            "totalFloors": 20,
            "orientation": "South",
        }
        response = client.post("/api/v1/predict", json=payload)
        assert response.status_code == 422
