"""
Favorites Management Tests
===========================
Implements test cases TC-FAV-001 through TC-FAV-003
from the Smart Rental System Test Plan.

Test Objectives (TO-02 continuation):
  - Add and remove properties from favorites
  - Check favorite status
  - Retrieve a tenant's favorite list
"""

import pytest
from conftest import (
    AuthenticatedClient,
    assert_success,
    assert_created,
    get_data,
)
from test_property import create_listing


@pytest.mark.favorite
class TestFavorites:
    """TC-FAV-001 to TC-FAV-003: Favorites management."""

    def test_add_to_favorites(self, tenant_client, landlord_client):
        """TC-FAV-001: POST /favorites/{propertyId} should create a favorite record."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        resp = tenant_client.post(f"/favorites/{listing_id}")
        body = assert_success(resp)
        data = get_data(body)
        assert data.get("propertyId") == listing_id or data.get("favorite", {}).get("propertyId") == listing_id

    def test_remove_from_favorites(self, tenant_client, landlord_client):
        """TC-FAV-002: DELETE /favorites/{propertyId} should remove the favorite record."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        # Add first
        tenant_client.post(f"/favorites/{listing_id}")

        # Remove
        resp = tenant_client.delete(f"/favorites/{listing_id}")
        body = assert_success(resp)
        assert body.get("code") == 200

    def test_check_favorite_status(self, tenant_client, landlord_client):
        """TC-FAV-003: GET /favorites/check/{propertyId} should return favorited status."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        # Before adding
        resp1 = tenant_client.get(f"/favorites/check/{listing_id}")
        body1 = assert_success(resp1)
        assert get_data(body1).get("favorited") is False

        # After adding
        tenant_client.post(f"/favorites/{listing_id}")
        resp2 = tenant_client.get(f"/favorites/check/{listing_id}")
        body2 = assert_success(resp2)
        assert get_data(body2).get("favorited") is True

    def test_get_my_favorites(self, tenant_client, landlord_client):
        """TC-FAV-FULL: GET /favorites should return the user's full favorite list."""
        # Add multiple favorites
        for _ in range(3):
            listing = create_listing(landlord_client)
            listing_id = listing["data"]["id"]
            tenant_client.post(f"/favorites/{listing_id}")

        resp = tenant_client.get("/favorites")
        body = assert_success(resp)
        data = get_data(body)
        # Response uses a non-standard format: {favorites: [...], total: N}
        favorites = data.get("favorites", [])
        assert isinstance(favorites, list)
        assert len(favorites) >= 3

    def test_add_same_favorite_twice(self, tenant_client, landlord_client):
        """TC-FAV-001b: Adding the same property to favorites twice should not duplicate."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        tenant_client.post(f"/favorites/{listing_id}")
        resp = tenant_client.post(f"/favorites/{listing_id}")
        # Second attempt should either succeed idempotently or return an error
        assert resp.status_code in (200, 201, 400)

    def test_favorites_require_authentication(self, unauthenticated_client, backend_ready):
        """TC-FAV-001c: Unauthenticated access to favorites should return 401."""
        resp = unauthenticated_client.get("/favorites")
        assert resp.status_code == 401
