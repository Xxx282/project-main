"""
Admin Dashboard & Moderation Tests
===================================
Implements test cases TC-ADMIN-001 through TC-ADMIN-004
from the Smart Rental System Test Plan.

Test Objectives (TO-09):
  - Admin dashboard displays accurate statistics
  - Admin can review, approve, or reject listings
  - Admin can review payment orders
  - Non-admin users are denied access to admin endpoints
"""

import pytest
from conftest import (
    AuthenticatedClient,
    assert_success,
    assert_error,
    get_data,
)
from test_property import create_listing


@pytest.mark.admin
class TestAdminDashboard:
    """TC-ADMIN-001: Admin dashboard statistics."""

    def test_admin_gets_dashboard(self, admin_client):
        """TC-ADMIN-001: GET /admin/dashboard should return correct statistics."""
        resp = admin_client.get("/admin/dashboard")
        body = assert_success(resp)
        data = get_data(body)
        # Dashboard should contain key metrics
        assert "users" in data or "listings" in data or "pendingListings" in data
        # All counts should be non-negative integers
        for key, value in data.items():
            if key not in ("inquiriesToday",):
                assert isinstance(value, int), f"{key} should be an integer"
                assert value >= 0, f"{key} should be non-negative"

    def test_dashboard_includes_pending_counts(self, admin_client):
        """TC-ADMIN-001b: Dashboard should include pending listings and orders counts."""
        resp = admin_client.get("/admin/dashboard")
        body = assert_success(resp)
        data = get_data(body)
        assert "pendingListings" in data
        assert "pendingOrders" in data
        assert isinstance(data["pendingListings"], int)
        assert isinstance(data["pendingOrders"], int)


@pytest.mark.admin
class TestAdminListingModeration:
    """TC-ADMIN-002: Admin listing approval and rejection."""

    def test_admin_approves_pending_listing(self, admin_client, landlord_client):
        """TC-ADMIN-002: PATCH /admin/listings/{id}?approved=true should approve the listing."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        resp = admin_client.patch(f"/admin/listings/{listing_id}?approved=true")
        body = assert_success(resp)
        data = get_data(body)
        assert data.get("status") in ("available", "AVAILABLE", "available_for_rent")

    def test_admin_rejects_listing(self, admin_client, landlord_client):
        """TC-ADMIN-002b: PATCH /admin/listings/{id}?approved=false should reject the listing."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        resp = admin_client.patch(f"/admin/listings/{listing_id}?approved=false")
        body = assert_success(resp)
        data = get_data(body)
        assert data.get("status") in ("offline", "OFFLINE", "rejected", "REJECTED")

    def test_admin_gets_pending_listings(self, admin_client):
        """TC-ADMIN-002c: GET /admin/listings should return the pending listings list."""
        resp = admin_client.get("/admin/listings")
        body = assert_success(resp)
        data = get_data(body)
        assert isinstance(data, list)


@pytest.mark.admin
class TestAdminUserManagement:
    """TC-ADMIN-USER: Admin user management endpoints."""

    def test_admin_gets_all_users(self, admin_client):
        """TC-ADMIN-USER-01: GET /admin/users should return all users."""
        resp = admin_client.get("/admin/users")
        body = assert_success(resp)
        data = get_data(body)
        assert isinstance(data, list)

    def test_admin_enables_user(self, admin_client, tenant_client):
        """TC-ADMIN-USER-02: PATCH /admin/users/{id}?enabled=true should enable the user."""
        user_id = tenant_client.user_id

        resp = admin_client.patch(f"/admin/users/{user_id}?enabled=true")
        body = assert_success(resp)
        data = get_data(body)
        assert data.get("isActive") is True or data.get("enabled") is True

    def test_admin_disables_user(self, admin_client, tenant_client):
        """TC-ADMIN-USER-03: PATCH /admin/users/{id}?enabled=false should disable the user."""
        user_id = tenant_client.user_id

        resp = admin_client.patch(f"/admin/users/{user_id}?enabled=false")
        body = assert_success(resp)
        data = get_data(body)
        # User should be deactivated
        assert data.get("isActive") is False or data.get("enabled") is False


@pytest.mark.admin
class TestAdminAccessControl:
    """TC-ADMIN-003 and TC-ADMIN-004: Role-based access control."""

    def test_tenant_cannot_access_dashboard(self, tenant_client):
        """TC-ADMIN-003: Tenant accessing admin dashboard should return 403."""
        resp = tenant_client.get("/admin/dashboard")
        assert resp.status_code in (401, 403)

    def test_landlord_cannot_access_dashboard(self, landlord_client):
        """TC-ADMIN-004: Landlord accessing admin dashboard should return 403."""
        resp = landlord_client.get("/admin/dashboard")
        assert resp.status_code in (401, 403)

    def test_unauthenticated_cannot_access_admin_endpoints(self, unauthenticated_client, backend_ready):
        """TC-ADMIN-004b: Unauthenticated access to admin endpoints should return 401."""
        resp = unauthenticated_client.get("/admin/dashboard")
        assert resp.status_code == 401

    def test_tenant_cannot_approve_listings(self, tenant_client, landlord_client):
        """TC-ADMIN-002c: Tenant attempting to approve a listing should return 403."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        resp = tenant_client.patch(f"/admin/listings/{listing_id}?approved=true")
        assert resp.status_code in (401, 403)

    def test_tenant_cannot_view_admin_users(self, tenant_client):
        """TC-ADMIN-USER-04: Tenant cannot access admin user management endpoint."""
        resp = tenant_client.get("/admin/users")
        assert resp.status_code in (401, 403)
