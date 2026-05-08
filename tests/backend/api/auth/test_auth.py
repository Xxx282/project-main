"""
Authentication & Authorisation Tests
=====================================
Implements test cases TC-AUTH-001 through TC-AUTH-012
from the Smart Rental System Test Plan.

Test Objectives (TO-01):
  - JWT-based login, registration, token validation
  - Role-based access control (tenant / landlord / admin)
  - Email verification and password reset flows
"""

import pytest
from conftest import (
    AuthenticatedClient,
    assert_success,
    assert_created,
    assert_error,
    get_data,
    unique_username,
    unique_email,
)


# =============================================================================
# Registration Tests
# =============================================================================

@pytest.mark.auth
class TestAuthRegistration:
    """TC-AUTH-001 to TC-AUTH-003: User registration flows."""

    def test_register_valid_data(self, unauthenticated_client, backend_ready):
        """TC-AUTH-001: User registration with valid data should succeed."""
        username = unique_username()
        email = unique_email()

        resp = unauthenticated_client.post("/auth/register", json={
            "username": username,
            "email": email,
            "password": "Test123456",
            "role": "tenant",
            "phone": "13800138001",
        })

        body = assert_created(resp)
        data = get_data(body)
        assert data.get("user", {}).get("username") == username
        assert data.get("token") is not None
        assert data.get("user", {}).get("email") == email

    def test_register_duplicate_username(self, unauthenticated_client, backend_ready):
        """TC-AUTH-002: Registering with an existing username should fail with 400."""
        username = unique_username()
        email1 = unique_email()
        email2 = unique_email()

        # First registration
        resp1 = unauthenticated_client.post("/auth/register", json={
            "username": username,
            "email": email1,
            "password": "Test123456",
            "role": "tenant",
            "phone": "13800138001",
        })
        assert_created(resp1)

        # Duplicate username
        resp2 = unauthenticated_client.post("/auth/register", json={
            "username": username,
            "email": email2,
            "password": "Test123456",
            "role": "tenant",
            "phone": "13800138002",
        })
        assert_error(resp2, expected_code=400)

    def test_register_duplicate_email(self, unauthenticated_client, backend_ready):
        """TC-AUTH-003: Registering with an existing email should fail with 400."""
        username1 = unique_username()
        username2 = unique_username()
        email = unique_email()

        # First registration
        resp1 = unauthenticated_client.post("/auth/register", json={
            "username": username1,
            "email": email,
            "password": "Test123456",
            "role": "tenant",
            "phone": "13800138001",
        })
        assert_created(resp1)

        # Duplicate email
        resp2 = unauthenticated_client.post("/auth/register", json={
            "username": username2,
            "email": email,
            "password": "Test123456",
            "role": "tenant",
            "phone": "13800138002",
        })
        assert_error(resp2, expected_code=400)

    @pytest.mark.parametrize("role", ["tenant", "landlord", "admin"])
    def test_register_all_roles(
        self, unauthenticated_client, backend_ready, role
    ):
        """TC-AUTH-007: Registration should succeed for all valid roles."""
        resp = unauthenticated_client.post("/auth/register", json={
            "username": unique_username(),
            "email": unique_email(),
            "password": "Test123456",
            "role": role,
            "phone": "13800138001",
        })
        body = assert_created(resp)
        assert get_data(body).get("user", {}).get("role", "").lower() == role


# =============================================================================
# Login Tests
# =============================================================================

@pytest.mark.auth
class TestAuthLogin:
    """TC-AUTH-004 to TC-AUTH-006: User login flows."""

    def test_login_correct_credentials(self, unauthenticated_client, backend_ready):
        """TC-AUTH-004: Login with correct username and password should succeed."""
        username = unique_username()
        email = unique_email()
        password = "Test123456"

        # Register first
        unauthenticated_client.post("/auth/register", json={
            "username": username,
            "email": email,
            "password": password,
            "role": "tenant",
            "phone": "13800138001",
        })

        # Login with username
        resp = unauthenticated_client.post("/auth/login", json={
            "usernameOrEmail": username,
            "password": password,
        })
        body = assert_success(resp)
        assert get_data(body).get("token") is not None

    def test_login_with_email(self, unauthenticated_client, backend_ready):
        """TC-AUTH-005: Login with email address should succeed."""
        username = unique_username()
        email = unique_email()
        password = "Test123456"

        unauthenticated_client.post("/auth/register", json={
            "username": username,
            "email": email,
            "password": password,
            "role": "tenant",
            "phone": "13800138001",
        })

        resp = unauthenticated_client.post("/auth/login", json={
            "usernameOrEmail": email,
            "password": password,
        })
        body = assert_success(resp)
        assert get_data(body).get("token") is not None

    def test_login_wrong_password(self, unauthenticated_client, backend_ready):
        """TC-AUTH-006: Login with incorrect password should return 401."""
        username = unique_username()
        email = unique_email()

        unauthenticated_client.post("/auth/register", json={
            "username": username,
            "email": email,
            "password": "Test123456",
            "role": "tenant",
            "phone": "13800138001",
        })

        resp = unauthenticated_client.post("/auth/login", json={
            "usernameOrEmail": username,
            "password": "WrongPassword!",
        })
        assert resp.status_code == 401


# =============================================================================
# Token / Me Endpoint Tests
# =============================================================================

@pytest.mark.auth
class TestAuthToken:
    """TC-AUTH-008 to TC-AUTH-009: JWT token validation and /auth/me endpoint."""

    def test_auth_me_returns_user_info(self, tenant_client):
        """TC-AUTH-008: GET /auth/me should return the authenticated user's info."""
        resp = tenant_client.get("/auth/me")
        body = assert_success(resp)
        data = get_data(body)
        assert data.get("id") is not None
        assert data.get("username") is not None
        assert "tenant" in data.get("role", "").lower()

    def test_unauthenticated_access_returns_401(self, unauthenticated_client, backend_ready):
        """TC-AUTH-009: Requests without a valid JWT token should return 401."""
        resp = unauthenticated_client.get("/auth/me")
        assert resp.status_code == 401

    def test_invalid_token_returns_401(self, unauthenticated_client, backend_ready):
        """TC-AUTH-009: Requests with an invalid JWT token should return 401."""
        resp = unauthenticated_client.get("/auth/me")
        resp.headers["Authorization"] = "Bearer invalid.token.here"
        resp2 = unauthenticated_client.get("/auth/me", headers={"Authorization": "Bearer invalid.token"})
        assert resp2.status_code == 401


# =============================================================================
# Check Username / Email Tests
# =============================================================================

@pytest.mark.auth
class TestAuthCheck:
    """TC-AUTH-010: Check-username and check-email utility endpoints."""

    def test_check_username_exists(self, unauthenticated_client, backend_ready):
        """TC-AUTH-010a: /auth/check-username returns true for existing usernames."""
        username = unique_username()
        unauthenticated_client.post("/auth/register", json={
            "username": username,
            "email": unique_email(),
            "password": "Test123456",
            "role": "tenant",
            "phone": "13800138001",
        })

        resp = unauthenticated_client.get(f"/auth/check-username?username={username}")
        body = assert_success(resp)
        assert get_data(body).get("exists") is True

    def test_check_username_not_exists(self, unauthenticated_client, backend_ready):
        """TC-AUTH-010b: /auth/check-username returns false for non-existing usernames."""
        resp = unauthenticated_client.get("/auth/check-username?username=nonexistentuser12345xyz")
        body = assert_success(resp)
        assert get_data(body).get("exists") is False

    def test_check_email_exists(self, unauthenticated_client, backend_ready):
        """TC-AUTH-010c: /auth/check-email returns true for existing emails."""
        email = unique_email()
        unauthenticated_client.post("/auth/register", json={
            "username": unique_username(),
            "email": email,
            "password": "Test123456",
            "role": "tenant",
            "phone": "13800138001",
        })

        resp = unauthenticated_client.get(f"/auth/check-email?email={email}")
        body = assert_success(resp)
        assert get_data(body).get("exists") is True

    def test_check_email_not_exists(self, unauthenticated_client, backend_ready):
        """TC-AUTH-010d: /auth/check-email returns false for non-existing emails."""
        resp = unauthenticated_client.get("/auth/check-email?email=nonexistent@test.com")
        body = assert_success(resp)
        assert get_data(body).get("exists") is False


# =============================================================================
# Password Reset Tests
# =============================================================================

@pytest.mark.auth
class TestAuthPasswordReset:
    """TC-AUTH-011 to TC-AUTH-012: Forgot-password and reset-password flows."""

    def test_forgot_password_returns_200(self, unauthenticated_client, backend_ready):
        """TC-AUTH-011: POST /auth/forgot-password with a registered email should return 200."""
        email = unique_email()
        unauthenticated_client.post("/auth/register", json={
            "username": unique_username(),
            "email": email,
            "password": "Test123456",
            "role": "tenant",
            "phone": "13800138001",
        })

        resp = unauthenticated_client.post("/auth/forgot-password", json={"email": email})
        # The endpoint returns 200 even if the email is registered (avoids email enumeration)
        assert resp.status_code == 200

    def test_forgot_password_invalid_email_format(self, unauthenticated_client, backend_ready):
        """TC-AUTH-011b: POST /auth/forgot-password with invalid email format should return 400."""
        resp = unauthenticated_client.post("/auth/forgot-password", json={"email": "not-an-email"})
        assert resp.status_code == 400

    def test_forgot_password_missing_email(self, unauthenticated_client, backend_ready):
        """TC-AUTH-011c: POST /auth/forgot-password without an email body should return 400."""
        resp = unauthenticated_client.post("/auth/forgot-password", json={})
        assert resp.status_code == 400

    def test_reset_password_invalid_token(self, unauthenticated_client, backend_ready):
        """TC-AUTH-012: POST /auth/reset-password with an invalid token should fail gracefully."""
        resp = unauthenticated_client.post("/auth/reset-password", json={
            "email": "some@test.com",
            "token": "invalid-token",
            "newPassword": "NewPass123",
        })
        # Should return 400 or 500 depending on token validation logic
        assert resp.status_code in (400, 500)
