"""
Test Configuration and Shared Fixtures
========================================
Provides shared pytest fixtures for the Smart Rental System test suite.
Requires the backend to be running on http://localhost:8080/api.
"""

import os
import pytest
import requests
from typing import Generator, Optional


# =============================================================================
# Backend Configuration
# =============================================================================

BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8080/api")
BACKEND_TIMEOUT = int(os.getenv("BACKEND_TIMEOUT", "10"))


# =============================================================================
# Helper Utilities
# =============================================================================

def is_backend_running() -> bool:
    """Check if the backend service is accessible."""
    try:
        resp = requests.get(f"{BACKEND_BASE_URL}/auth/check-username?username=test", timeout=3)
        return True
    except requests.exceptions.RequestException:
        return False


def wait_for_backend(max_wait: int = 30) -> bool:
    """Poll the backend until it responds or max_wait seconds elapse."""
    import time
    start = time.time()
    while time.time() - start < max_wait:
        if is_backend_running():
            return True
        time.sleep(1)
    return False


# =============================================================================
# Authenticated Client Fixture
# =============================================================================

class AuthenticatedClient:
    """
    A thin HTTP client wrapper that automatically attaches JWT tokens.
    Simulates a logged-in user for API testing.
    """

    def __init__(self, base_url: str, token: Optional[str] = None, role: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.role = role

    @property
    def headers(self) -> dict:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _url(self, path: str) -> str:
        if path.startswith("http"):
            return path
        return f"{self.base_url}/{path.lstrip('/')}"

    def get(self, path: str, **kwargs) -> requests.Response:
        return requests.get(self._url(path), headers=self.headers, timeout=BACKEND_TIMEOUT, **kwargs)

    def post(self, path: str, json: Optional[dict] = None, **kwargs) -> requests.Response:
        return requests.post(self._url(path), json=json, headers=self.headers, timeout=BACKEND_TIMEOUT, **kwargs)

    def put(self, path: str, json: Optional[dict] = None, **kwargs) -> requests.Response:
        return requests.put(self._url(path), json=json, headers=self.headers, timeout=BACKEND_TIMEOUT, **kwargs)

    def patch(self, path: str, json: Optional[dict] = None, **kwargs) -> requests.Response:
        return requests.patch(self._url(path), json=json, headers=self.headers, timeout=BACKEND_TIMEOUT, **kwargs)

    def delete(self, path: str, **kwargs) -> requests.Response:
        return requests.delete(self._url(path), headers=self.headers, timeout=BACKEND_TIMEOUT, **kwargs)


# =============================================================================
# Test Data Factory
# =============================================================================

_counter = 0


def next_id() -> int:
    global _counter
    _counter += 1
    return _counter


def unique_username(prefix: str = "user") -> str:
    return f"{prefix}_test_{next_id()}"


def unique_email(prefix: str = "user") -> str:
    return f"{prefix}_test_{next_id()}@test.com"


# =============================================================================
# User Registration Helper
# =============================================================================

def register_user(
    client: AuthenticatedClient,
    username: Optional[str] = None,
    email: Optional[str] = None,
    password: str = "Test123456",
    role: str = "tenant",
    phone: str = "13800138000",
) -> tuple[dict, str]:
    """
    Register a new user and return (user_data, token).
    The token is extracted from the registration response.
    """
    username = username or unique_username()
    email = email or unique_email()

    resp = client.post("/auth/register", json={
        "username": username,
        "email": email,
        "password": password,
        "role": role,
        "phone": phone,
    })
    resp.raise_for_status()
    body = resp.json()
    token = body.get("data", {}).get("token")
    user_data = body.get("data", {}).get("user", {})
    return user_data, token


def login_user(
    client: AuthenticatedClient,
    username_or_email: str,
    password: str = "Test123456",
) -> tuple[dict, str]:
    """
    Login a user and return (user_data, token).
    """
    resp = client.post("/auth/login", json={
        "usernameOrEmail": username_or_email,
        "password": password,
    })
    resp.raise_for_status()
    body = resp.json()
    token = body.get("data", {}).get("token")
    user_data = body.get("data", {}).get("user", {})
    return user_data, token


# =============================================================================
# Shared Pytest Fixtures
# =============================================================================

@pytest.fixture(scope="session")
def backend_url() -> str:
    """Base URL of the backend API."""
    return BACKEND_BASE_URL


@pytest.fixture(scope="session")
def unauthenticated_client(backend_url: str) -> AuthenticatedClient:
    """A plain HTTP client without authentication headers."""
    return AuthenticatedClient(backend_url)


@pytest.fixture(scope="session")
def backend_ready(unauthenticated_client: AuthenticatedClient) -> bool:
    """
    Session-scoped check that the backend is reachable.
    Skips the entire test session if the backend is not running.
    """
    if not is_backend_running():
        pytest.skip("Backend is not running at " + BACKEND_BASE_URL)
    return True


@pytest.fixture
def tenant_client(unauthenticated_client: AuthenticatedClient, backend_ready: bool) -> AuthenticatedClient:
    """A client authenticated as a tenant."""
    user_data, token = register_user(unauthenticated_client, role="tenant")
    client = AuthenticatedClient(BACKEND_BASE_URL, token=token, role="tenant")
    client.user_id = user_data.get("id")
    return client


@pytest.fixture
def landlord_client(unauthenticated_client: AuthenticatedClient, backend_ready: bool) -> AuthenticatedClient:
    """A client authenticated as a landlord."""
    user_data, token = register_user(unauthenticated_client, role="landlord")
    client = AuthenticatedClient(BACKEND_BASE_URL, token=token, role="landlord")
    client.user_id = user_data.get("id")
    return client


@pytest.fixture
def admin_client(unauthenticated_client: AuthenticatedClient, backend_ready: bool) -> AuthenticatedClient:
    """A client authenticated as an admin."""
    user_data, token = register_user(unauthenticated_client, role="admin")
    client = AuthenticatedClient(BACKEND_BASE_URL, token=token, role="admin")
    client.user_id = user_data.get("id")
    return client


# =============================================================================
# Convenience Response Assertions
# =============================================================================

def assert_success(resp: requests.Response, expected_code: int = 200) -> dict:
    """Assert that the response was successful and return the JSON body."""
    assert resp.status_code == expected_code, (
        f"Expected {expected_code}, got {resp.status_code}: {resp.text}"
    )
    body = resp.json()
    assert body.get("code") == expected_code, f"Response code mismatch: {body}"
    return body


def assert_error(resp: requests.Response, expected_code: int = 400) -> dict:
    """Assert that the response is an error and return the JSON body."""
    assert resp.status_code == expected_code, (
        f"Expected error status {expected_code}, got {resp.status_code}: {resp.text}"
    )
    return resp.json()


def assert_created(resp: requests.Response) -> dict:
    """Assert that the response is 201 Created and return the JSON body."""
    return assert_success(resp, expected_code=201)


def get_data(body: dict) -> dict:
    """Shorthand: extract the 'data' field from a standard response body."""
    return body.get("data", {})
