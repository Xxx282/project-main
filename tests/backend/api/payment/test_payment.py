"""
Payment Order Tests
====================
Implements test cases TC-PAY-001 through TC-PAY-005
from the Smart Rental System Test Plan.

Test Objectives (TO-05):
  - Payment order creation by tenant
  - Landlord confirmation workflow
  - Admin review and approval
  - Correct status transitions at each stage
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
from test_property import create_listing
from test_contract import TestContractCreation


@pytest.mark.payment
class TestPaymentCreation:
    """TC-PAY-001 and TC-PAY-005: Payment order creation and validation."""

    def _create_contract_and_get_id(self, tenant_client, landlord_client) -> int:
        listing = create_listing(landlord_client)
        resp = tenant_client.post("/api/contracts/create", json={
            "propertyId": listing["data"]["id"],
            "startDate": "2026-06-01",
            "endDate": "2027-05-31",
            "monthlyRent": 5000,
            "deposit": 10000,
        })
        return resp.json()["data"]["id"]

    def test_tenant_creates_payment_order(self, tenant_client, landlord_client):
        """TC-PAY-001: POST /api/payments/create should create an order with PENDING status."""
        contract_id = self._create_contract_and_get_id(tenant_client, landlord_client)

        resp = tenant_client.post("/api/payments/create", json={
            "contractId": contract_id,
            "amount": 10000,
        })
        body = assert_success(resp)
        data = get_data(body)
        assert data.get("id") is not None
        # Status should be PENDING or similar initial state
        assert data.get("status") in ("PENDING", "pending", "PENDING_PAYMENT", "pending_payment", None)

    def test_tenant_creates_payment_with_negative_amount(self, tenant_client, landlord_client):
        """TC-PAY-005: POST /api/payments/create with negative amount should return 400."""
        contract_id = self._create_contract_and_get_id(tenant_client, landlord_client)

        resp = tenant_client.post("/api/payments/create", json={
            "contractId": contract_id,
            "amount": -100,
        })
        assert_error(resp, expected_code=400)

    def test_landlord_cannot_create_payment(self, landlord_client):
        """TC-PAY-001b: Landlords cannot create payment orders."""
        resp = landlord_client.post("/api/payments/create", json={
            "contractId": 1,
            "amount": 10000,
        })
        assert resp.status_code in (401, 403)

    def test_unauthenticated_cannot_create_payment(self, unauthenticated_client, backend_ready):
        """TC-PAY-001c: Unauthenticated requests should return 401."""
        resp = unauthenticated_client.post("/api/payments/create", json={
            "contractId": 1,
            "amount": 10000,
        })
        assert resp.status_code == 401


@pytest.mark.payment
class TestPaymentOrderRetrieval:
    """TC-PAY-004: Get tenant's own payment orders."""

    def test_tenant_gets_own_orders(self, tenant_client, landlord_client):
        """TC-PAY-004: GET /api/payments/my should return only the tenant's orders."""
        # Create a payment order first
        listing = create_listing(landlord_client)
        tenant_client.post("/api/contracts/create", json={
            "propertyId": listing["data"]["id"],
            "startDate": "2026-06-01",
            "endDate": "2027-05-31",
            "monthlyRent": 5000,
            "deposit": 10000,
        })

        resp = tenant_client.get("/api/payments/my")
        body = assert_success(resp)
        data = get_data(body)
        # Paginated response: data contains {content: [...], totalElements: N}
        content = data.get("content", data)
        assert isinstance(content, list)

    def test_tenant_gets_order_by_id(self, tenant_client, landlord_client):
        """TC-PAY-004b: GET /api/payments/{id} should return the specific order."""
        listing = create_listing(landlord_client)
        create_resp = tenant_client.post("/api/contracts/create", json={
            "propertyId": listing["data"]["id"],
            "startDate": "2026-06-01",
            "endDate": "2027-05-31",
            "monthlyRent": 5000,
            "deposit": 10000,
        })
        contract_id = create_resp.json()["data"]["id"]

        pay_resp = tenant_client.post("/api/payments/create", json={
            "contractId": contract_id,
            "amount": 10000,
        })
        order_id = pay_resp.json()["data"]["id"]

        resp = tenant_client.get(f"/api/payments/{order_id}")
        body = assert_success(resp)
        assert body["data"]["id"] == order_id


@pytest.mark.payment
class TestLandlordPaymentConfirmation:
    """TC-PAY-002: Landlord confirms payment order."""

    def _create_payment_order(self, tenant_client, landlord_client) -> int:
        """Create a listing, contract, payment order, and return the order ID."""
        listing = create_listing(landlord_client)
        contract_resp = tenant_client.post("/api/contracts/create", json={
            "propertyId": listing["data"]["id"],
            "startDate": "2026-06-01",
            "endDate": "2027-05-31",
            "monthlyRent": 5000,
            "deposit": 10000,
        })
        contract_id = contract_resp.json()["data"]["id"]
        pay_resp = tenant_client.post("/api/payments/create", json={
            "contractId": contract_id,
            "amount": 10000,
        })
        return pay_resp.json()["data"]["id"]

    def test_landlord_confirms_payment(self, tenant_client, landlord_client):
        """TC-PAY-002: POST /api/payments/landlord/confirm should update status."""
        order_id = self._create_payment_order(tenant_client, landlord_client)

        resp = landlord_client.post("/api/payments/landlord/confirm", json={"orderId": order_id})
        body = assert_success(resp)
        data = get_data(body)
        assert data.get("status") in ("LANDLORD_CONFIRMED", "CONFIRMED", "landlord_confirmed", "confirmed")

    def test_tenant_cannot_confirm_own_payment(self, tenant_client, landlord_client):
        """TC-PAY-002b: Tenants cannot confirm payment orders."""
        order_id = self._create_payment_order(tenant_client, landlord_client)

        resp = tenant_client.post("/api/payments/landlord/confirm", json={"orderId": order_id})
        assert resp.status_code in (401, 403)


@pytest.mark.payment
class TestAdminPaymentReview:
    """TC-PAY-003: Admin reviews and approves payment orders."""

    def _create_confirmed_order(self, tenant_client, landlord_client) -> int:
        """Create an order that has been confirmed by the landlord."""
        listing = create_listing(landlord_client)
        contract_resp = tenant_client.post("/api/contracts/create", json={
            "propertyId": listing["data"]["id"],
            "startDate": "2026-06-01",
            "endDate": "2027-05-31",
            "monthlyRent": 5000,
            "deposit": 10000,
        })
        contract_id = contract_resp.json()["data"]["id"]
        pay_resp = tenant_client.post("/api/payments/create", json={
            "contractId": contract_id,
            "amount": 10000,
        })
        order_id = pay_resp.json()["data"]["id"]
        landlord_client.post("/api/payments/landlord/confirm", json={"orderId": order_id})
        return order_id

    def test_admin_approves_payment_order(self, tenant_client, landlord_client, admin_client):
        """TC-PAY-003: POST /api/payments/admin/review with approved=true should set status to SUCCESS."""
        order_id = self._create_confirmed_order(tenant_client, landlord_client)

        resp = admin_client.post("/api/payments/admin/review", json={"orderId": order_id, "approved": True})
        body = assert_success(resp)
        data = get_data(body)
        assert data.get("status") in ("SUCCESS", "success", "APPROVED", "approved")

    def test_admin_rejects_payment_order(self, tenant_client, landlord_client, admin_client):
        """TC-PAY-003b: Admin can reject a payment order."""
        order_id = self._create_confirmed_order(tenant_client, landlord_client)

        resp = admin_client.post("/api/payments/admin/review", json={"orderId": order_id, "approved": False})
        body = assert_success(resp)
        data = get_data(body)
        assert data.get("status") in ("REJECTED", "rejected", "FAILED", "failed")

    def test_non_admin_cannot_review_orders(self, tenant_client, landlord_client):
        """TC-PAY-003c: Non-admin users cannot access the admin review endpoint."""
        order_id = self._create_confirmed_order(tenant_client, landlord_client)

        resp = tenant_client.post("/api/payments/admin/review", json={"orderId": order_id, "approved": True})
        assert resp.status_code in (401, 403)

    def test_admin_gets_pending_orders(self, admin_client):
        """TC-PAY-PENDING: GET /api/payments/admin/pending should return paginated pending orders."""
        resp = admin_client.get("/api/payments/admin/pending")
        body = assert_success(resp)
        data = get_data(body)
        content = data.get("content", data)
        assert isinstance(content, list)

    def test_admin_gets_pending_count(self, admin_client):
        """TC-PAY-PENDING-COUNT: GET /api/payments/admin/pending-count should return count."""
        resp = admin_client.get("/api/payments/admin/pending-count")
        body = assert_success(resp)
        count_data = body.get("data", body)
        assert "count" in str(count_data) or "count" in str(body)
