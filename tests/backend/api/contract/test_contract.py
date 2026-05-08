"""
Rental Contract Tests
======================
Implements test cases TC-CON-001 through TC-CON-004
from the Smart Rental System Test Plan.

Test Objectives (TO-04):
  - Contract creation by tenant
  - Dual e-signature workflow: tenant signs, then landlord signs
  - Contract status transitions (PENDING_SIGN → SIGNED → COMPLETED)
"""

import pytest
from conftest import (
    AuthenticatedClient,
    assert_success,
    get_data,
)
from test_property import create_listing


@pytest.mark.contract
class TestContractCreation:
    """TC-CON-001: Contract creation by tenant."""

    def _create_listing_and_get_id(self, landlord_client: AuthenticatedClient) -> int:
        listing = create_listing(landlord_client)
        return listing["data"]["id"]

    def test_tenant_creates_contract(self, tenant_client, landlord_client):
        """TC-CON-001: POST /api/contracts/create should create a contract with PENDING_SIGN status."""
        listing_id = self._create_listing_and_get_id(landlord_client)

        resp = tenant_client.post("/api/contracts/create", json={
            "propertyId": listing_id,
            "startDate": "2026-06-01",
            "endDate": "2027-05-31",
            "monthlyRent": 5000,
            "deposit": 10000,
        })
        body = assert_success(resp)
        data = get_data(body)
        assert data.get("id") is not None
        # Status should be PENDING_SIGN (dual signature required)
        assert data.get("status") in ("PENDING_SIGN", "PENDING", "pending_sign")

    def test_landlord_cannot_create_contract(self, landlord_client):
        """TC-CON-001b: Landlords cannot create rental contracts."""
        resp = landlord_client.post("/api/contracts/create", json={
            "propertyId": 1,
            "startDate": "2026-06-01",
            "endDate": "2027-05-31",
            "monthlyRent": 5000,
            "deposit": 10000,
        })
        # Role-based access should block this
        assert resp.status_code in (401, 403)

    def test_contract_requires_authentication(self, unauthenticated_client, backend_ready):
        """TC-CON-001c: Creating a contract without auth should return 401."""
        resp = unauthenticated_client.post("/api/contracts/create", json={
            "propertyId": 1,
            "startDate": "2026-06-01",
            "endDate": "2027-05-31",
            "monthlyRent": 5000,
            "deposit": 10000,
        })
        assert resp.status_code == 401


@pytest.mark.contract
class TestContractSigning:
    """TC-CON-002 to TC-CON-003: Dual e-signature workflow."""

    def _create_and_sign_as_tenant(self, tenant_client, landlord_client) -> dict:
        """Helper: create a listing and contract, then return (contract_id, listing_id)."""
        listing = create_listing(landlord_client)
        listing_id = listing["data"]["id"]

        # Create contract
        resp = tenant_client.post("/api/contracts/create", json={
            "propertyId": listing_id,
            "startDate": "2026-06-01",
            "endDate": "2027-05-31",
            "monthlyRent": 5000,
            "deposit": 10000,
        })
        contract_id = resp.json()["data"]["id"]
        return contract_id, listing_id

    def test_tenant_signs_contract(self, tenant_client, landlord_client):
        """TC-CON-002: POST /api/contracts/sign should record tenant signature and IP."""
        contract_id, _ = self._create_and_sign_as_tenant(tenant_client, landlord_client)

        resp = tenant_client.post("/api/contracts/sign", json={"contractId": contract_id})
        body = assert_success(resp)
        data = get_data(body)
        # tenantSignature should be recorded
        assert data.get("tenantSignature") is not None

    def test_landlord_signs_after_tenant(self, tenant_client, landlord_client):
        """TC-CON-003: After tenant signs, landlord signs to complete dual-signature."""
        contract_id, _ = self._create_and_sign_as_tenant(tenant_client, landlord_client)

        # Tenant signs first
        tenant_client.post("/api/contracts/sign", json={"contractId": contract_id})

        # Landlord signs
        resp = landlord_client.post("/api/contracts/landlord/sign", json={"contractId": contract_id})
        body = assert_success(resp)
        data = get_data(body)
        assert data.get("landlordSignature") is not None

    def test_contract_not_completed_without_both_signatures(self, tenant_client, landlord_client):
        """TC-CON-003b: Contract should not be marked as fully signed without both parties."""
        contract_id, _ = self._create_and_sign_as_tenant(tenant_client, landlord_client)

        # Only tenant signs
        resp = tenant_client.post("/api/contracts/sign", json={"contractId": contract_id})
        data = resp.json()["data"]
        # Status should NOT be COMPLETED / SIGNED yet
        assert data.get("status") not in ("COMPLETED", "SIGNED", "completed", "signed")

    def test_landlord_signs_before_tenant(self, tenant_client, landlord_client):
        """TC-CON-003c: Landlord signing before tenant should fail or not complete the contract."""
        contract_id, _ = self._create_and_sign_as_tenant(tenant_client, landlord_client)

        # Landlord tries to sign before tenant
        resp = landlord_client.post("/api/contracts/landlord/sign", json={"contractId": contract_id})
        # Should either return error or not mark as fully signed
        if resp.status_code == 200:
            data = resp.json()["data"]
            assert data.get("status") not in ("COMPLETED", "SIGNED", "completed", "signed")


@pytest.mark.contract
class TestContractRetrieval:
    """TC-CON-004: Contract detail and list retrieval."""

    def test_get_contract_detail(self, tenant_client, landlord_client):
        """TC-CON-004: GET /api/contracts/{id} should return full contract data."""
        listing = create_listing(landlord_client)
        resp = tenant_client.post("/api/contracts/create", json={
            "propertyId": listing["data"]["id"],
            "startDate": "2026-06-01",
            "endDate": "2027-05-31",
            "monthlyRent": 5000,
            "deposit": 10000,
        })
        contract_id = resp.json()["data"]["id"]

        resp2 = tenant_client.get(f"/api/contracts/{contract_id}")
        body = assert_success(resp2)
        data = get_data(body)
        assert data.get("id") == contract_id

    def test_tenant_gets_my_contracts(self, tenant_client, landlord_client):
        """TC-CON-004b: GET /api/contracts/my should return the tenant's contracts."""
        listing = create_listing(landlord_client)
        tenant_client.post("/api/contracts/create", json={
            "propertyId": listing["data"]["id"],
            "startDate": "2026-06-01",
            "endDate": "2027-05-31",
            "monthlyRent": 5000,
            "deposit": 10000,
        })

        resp = tenant_client.get("/api/contracts/my")
        body = assert_success(resp)
        contracts = get_data(body)
        assert isinstance(contracts, list)
        assert len(contracts) >= 1

    def test_landlord_gets_my_contracts(self, tenant_client, landlord_client):
        """TC-CON-004c: GET /api/contracts/landlord/my should return the landlord's contracts."""
        listing = create_listing(landlord_client)
        tenant_client.post("/api/contracts/create", json={
            "propertyId": listing["data"]["id"],
            "startDate": "2026-06-01",
            "endDate": "2027-05-31",
            "monthlyRent": 5000,
            "deposit": 10000,
        })

        resp = landlord_client.get("/api/contracts/landlord/my")
        body = assert_success(resp)
        contracts = get_data(body)
        assert isinstance(contracts, list)
        assert len(contracts) >= 1

    def test_admin_can_view_all_contracts(self, tenant_client, landlord_client, admin_client):
        """TC-CON-004d: Admin should be able to view all contracts."""
        listing = create_listing(landlord_client)
        tenant_client.post("/api/contracts/create", json={
            "propertyId": listing["data"]["id"],
            "startDate": "2026-06-01",
            "endDate": "2027-05-31",
            "monthlyRent": 5000,
            "deposit": 10000,
        })

        resp = admin_client.get("/api/contracts/admin/all")
        body = assert_success(resp)
        contracts = get_data(body)
        assert isinstance(contracts, list)
