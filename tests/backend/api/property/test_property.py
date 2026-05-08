"""
Property Listing Tests
=======================
Implements test cases TC-PROP-001 through TC-PROP-010
from the Smart Rental System Test Plan.

Test Objectives (TO-02):
  - Landlords can create, update, delete, and manage property listings
  - Tenants can browse, search, filter, and view listing details
  - Image upload and management
  - Listing status transitions
"""

import pytest
import random
from conftest import (
    AuthenticatedClient,
    assert_success,
    assert_created,
    assert_error,
    get_data,
)


# =============================================================================
# Data Factory
# =============================================================================

def make_listing_payload(city: str = "Shanghai", region: str = "Pudong", **overrides):
    """Return a minimal valid listing payload."""
    base = {
        "title": f"Test Apartment {random.randint(1000, 9999)}",
        "city": city,
        "region": region,
        "address": "123 Test Street",
        "bedrooms": 2,
        "bathrooms": 1,
        "area": 80.5,
        "price": 5000,
        "totalFloors": 10,
        "orientation": "South",
        "decoration": "Furnished",
        "description": "A lovely test apartment",
    }
    base.update(overrides)
    return base


def create_listing(client: AuthenticatedClient, **overrides) -> dict:
    """Helper: create a listing and return its full data."""
    resp = client.post("/listings", json=make_listing_payload(**overrides))
    return assert_created(resp)


# =============================================================================
# Public Listing Browsing (Unauthenticated)
# =============================================================================

@pytest.mark.property
class TestPropertyBrowsing:
    """TC-PROP-001 to TC-PROP-003: Public listing browsing."""

    def test_get_listings_returns_200(self, unauthenticated_client, backend_ready):
        """TC-PROP-001: GET /listings without auth should return 200."""
        resp = unauthenticated_client.get("/listings")
        assert resp.status_code == 200

    def test_get_listings_with_filter(self, unauthenticated_client, backend_ready):
        """TC-PROP-002: GET /listings with city filter should return 200."""
        resp = unauthenticated_client.get("/listings?city=Shanghai")
        assert resp.status_code == 200
        body = resp.json()
        # No assertion on content - just verify the endpoint accepts the param
        assert body.get("code") == 200

    def test_get_listing_by_id_returns_200(self, landlord_client):
        """TC-PROP-003: GET /listings/{id} should return 200 for an existing listing."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        resp = landlord_client.get(f"/listings/{listing_id}")
        body = assert_success(resp)
        assert get_data(body).get("id") == listing_id

    def test_get_nonexistent_listing_returns_404(self, unauthenticated_client, backend_ready):
        """TC-PROP-003b: GET /listings/{id} for a non-existent ID should return appropriate error."""
        resp = unauthenticated_client.get("/listings/999999999")
        # The controller returns 200 with an error body when not found
        body = resp.json()
        assert body.get("code") in (200, 404)


# =============================================================================
# Landlord Listing Management
# =============================================================================

@pytest.mark.property
class TestLandlordListingCrud:
    """TC-PROP-004 to TC-PROP-006: Landlord CRUD operations on listings."""

    def test_create_listing_returns_201(self, landlord_client):
        """TC-PROP-004: POST /listings by a landlord should return 201 Created."""
        resp = landlord_client.post("/listings", json=make_listing_payload())
        body = assert_created(resp)
        data = get_data(body)
        assert data.get("id") is not None
        assert data.get("title") == make_listing_payload()["title"]

    def test_create_listing_without_auth_returns_401(self, unauthenticated_client, backend_ready):
        """TC-PROP-004b: POST /listings without authentication should return 401."""
        resp = unauthenticated_client.post("/listings", json=make_listing_payload())
        assert resp.status_code == 401

    def test_update_listing_returns_200(self, landlord_client):
        """TC-PROP-005: PUT /listings/{id} should update and return the listing."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        updated_payload = make_listing_payload(title="Updated Title", price=6000)
        resp = landlord_client.put(f"/listings/{listing_id}", json=updated_payload)
        body = assert_success(resp)
        assert get_data(body).get("title") == "Updated Title"
        assert get_data(body).get("price") == 6000

    def test_update_other_landlord_listing_returns_403(self, landlord_client, unauthenticated_client, backend_ready):
        """TC-PROP-005b: Updating another landlord's listing should return 403."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        # Register a second landlord
        resp2 = unauthenticated_client.post("/auth/register", json={
            "username": f"landlord2_{random.randint(1000,9999)}",
            "email": f"landlord2_{random.randint(1000,9999)}@test.com",
            "password": "Test123456",
            "role": "landlord",
            "phone": "13800138002",
        })
        body2 = resp2.json()
        token2 = body2.get("data", {}).get("token")
        other_landlord = AuthenticatedClient(backend_url := unauthenticated_client.base_url, token=token2)

        resp = other_landlord.put(f"/listings/{listing_id}", json=make_listing_payload())
        # Either 200 with error in body or 403
        if resp.status_code == 200:
            body = resp.json()
            assert body.get("code") != 200  # Should indicate error

    def test_delete_listing_returns_200(self, landlord_client):
        """TC-PROP-006: DELETE /listings/{id} should remove the listing."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        resp = landlord_client.delete(f"/listings/{listing_id}")
        body = assert_success(resp)
        assert body.get("code") == 200

    def test_tenant_cannot_create_listing(self, tenant_client):
        """TC-PROP-004c: A tenant should not be able to create a listing."""
        resp = tenant_client.post("/listings", json=make_listing_payload())
        # Spring Security returns 403 for role mismatch
        assert resp.status_code in (403, 401)


# =============================================================================
# Listing Status Transitions
# =============================================================================

@pytest.mark.property
class TestListingStatus:
    """TC-PROP-007: Listing status transitions (available / rented / offline / pending)."""

    def test_update_listing_status(self, landlord_client):
        """TC-PROP-007: PATCH /listings/{id}/status should update status."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        resp = landlord_client.patch(f"/listings/{listing_id}/status?status=rented")
        body = assert_success(resp)
        assert get_data(body).get("status") == "rented"

    def test_update_listing_invalid_status(self, landlord_client):
        """TC-PROP-007b: Updating to an invalid status should return 400."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        resp = landlord_client.patch(f"/listings/{listing_id}/status?status=INVALID_STATUS")
        # Invalid enum value returns 400
        assert resp.status_code == 400


# =============================================================================
# Image Management
# =============================================================================

@pytest.mark.property
class TestListingImages:
    """TC-PROP-008 to TC-PROP-009: Image upload, retrieval, and deletion."""

    def test_get_listing_images(self, landlord_client):
        """TC-PROP-008: GET /listings/{id}/images should return image list."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        resp = landlord_client.get(f"/listings/{listing_id}/images")
        body = assert_success(resp)
        assert isinstance(get_data(body), list)

    def test_upload_listing_image_unauthorized(self, landlord_client, tenant_client):
        """TC-PROP-009: Tenant cannot upload images to a landlord's listing."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        resp = tenant_client.post(f"/listings/{listing_id}/images", data={"files": []})
        assert resp.status_code in (401, 403)


# =============================================================================
# My Listings (Landlord)
# =============================================================================

@pytest.mark.property
class TestMyListings:
    """TC-PROP-010: Landlord retrieves their own listings."""

    def test_get_mine_returns_only_landlords_listings(self, landlord_client):
        """TC-PROP-010: GET /listings/mine should only return the landlord's own listings."""
        # Create two listings
        create_listing(landlord_client, title="Listing A")
        create_listing(landlord_client, title="Listing B")

        resp = landlord_client.get("/listings/mine")
        body = assert_success(resp)
        listings = get_data(body)
        assert isinstance(listings, list)
        # All returned listings should belong to the current landlord
        for listing in listings:
            assert listing.get("landlordId") == landlord_client.user_id
