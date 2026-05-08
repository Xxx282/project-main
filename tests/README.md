# Smart Rental System - Test Suite

## Project Overview

This directory contains the automated test suite for the **Smart Rental System**, a full-stack platform for residential property rental management featuring AI-powered search, ML-based rent price prediction, and an Alipay payment monitoring system.

## Test Structure

```
tests/
├── conftest.py              # Shared pytest fixtures and utilities
├── pytest.ini                # Pytest configuration
├── README.md                 # This file
│
├── backend/
│   └── api/                  # Backend REST API tests
│       ├── auth/             # Authentication & authorization tests
│       ├── property/         # Property listing CRUD tests
│       ├── tenant/           # Tenant recommendation tests
│       ├── favorite/         # Favorites management tests
│       ├── conversation/     # Chat / conversation tests
│       ├── contract/         # Rental contract workflow tests
│       ├── payment/          # Payment order management tests
│       ├── ml/               # ML price prediction integration tests
│       ├── ai/               # AI smart search tests
│       └── admin/            # Admin dashboard & moderation tests
│
├── ml/                       # ML service unit tests (rent-price-ml)
└── payment/                  # Payment monitor service tests
```

## Prerequisites

### Services

All tests target the running services. Start the required services before running tests:

```powershell
# Backend (Spring Boot) - port 8080
cd backend
mvn spring-boot:run

# ML Service (FastAPI) - port 5000
cd rent-price-ml
python app/main.py

# Payment Monitor (FastAPI) - port 5001
cd payment
python app/main.py
```

### Python Environment

```bash
cd tests
pip install -r requirements.txt
```

## Running Tests

### Run All Tests

```bash
pytest
```

### Run by Category

```bash
# Authentication tests only
pytest tests/backend/api/auth/ -v

# Property listing tests
pytest tests/backend/api/property/ -v

# Contract workflow tests
pytest tests/backend/api/contract/ -v

# Payment tests
pytest tests/backend/api/payment/ -v

# ML service tests
pytest tests/ml/ -v
```

### Run by Marker

```bash
pytest -m auth -v
pytest -m property -v
pytest -m ml -v
pytest -m smoke -v
```

### Run Specific Test File / Function

```bash
pytest tests/backend/api/auth/test_auth.py::TestAuthRegistration::test_register_valid_data -v
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BACKEND_BASE_URL` | `http://localhost:8080/api` | Backend base URL |
| `ML_BASE_URL` | `http://localhost:5000` | ML service base URL |
| `PAYMENT_BASE_URL` | `http://localhost:5001` | Payment monitor base URL |
| `BACKEND_TIMEOUT` | `10` | HTTP request timeout (seconds) |

### Skip Slow Tests

```bash
pytest -m "not integration" -v
```

## Test Plan Reference

This test suite implements the test cases defined in:
`../../main/07_Testing_and_Quality_Assurance/Tests_Plan.docx`

### Coverage Summary

| Module | Test Cases | Priority |
|---|---|---|
| Authentication & Authorisation | TC-AUTH-001 ~ TC-AUTH-012 | P0, P1 |
| Property Listings | TC-PROP-001 ~ TC-PROP-010 | P0, P1 |
| Tenant Recommendations | TC-REC-001 ~ TC-REC-003 | P1, P2 |
| Favorites | TC-FAV-001 ~ TC-FAV-003 | P1, P2 |
| Rental Contracts | TC-CON-001 ~ TC-CON-004 | P0, P1 |
| Payment Orders | TC-PAY-001 ~ TC-PAY-005 | P0, P1 |
| Consultation / Chat | TC-CHAT-001 ~ TC-CHAT-005 | P0, P1 |
| ML Price Prediction | TC-ML-001 ~ TC-ML-004 | P0, P1 |
| AI Smart Search | TC-AI-001 ~ TC-AI-003 | P1, P2 |
| Admin Dashboard | TC-ADMIN-001 ~ TC-ADMIN-004 | P0, P1 |

## Design Notes

- **AuthenticatedClient**: All backend API tests use the `AuthenticatedClient` helper class from `conftest.py`, which automatically attaches JWT Bearer tokens to every request.
- **Fixture-based Auth**: Each test module receives pre-authenticated clients (`tenant_client`, `landlord_client`, `admin_client`) as fixtures. Users are registered fresh for each test to avoid cross-test interference.
- **Standard Response Format**: All backend endpoints return `{code, message, data, timestamp}`. The `assert_success()` and `assert_created()` helpers in `conftest.py` enforce this contract.
- **Skip on Service Unavailable**: Tests skip gracefully if the backend or ML service is not running.
- **No DB Cleanup**: Tests are designed to be idempotent and use unique identifiers per run. They can be run against a development database without manual cleanup.
