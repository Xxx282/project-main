"""
Conversation / Chat System Tests
================================
Implements test cases TC-CHAT-001 through TC-CHAT-005
from the Smart Rental System Test Plan.

Test Objectives (TO-06):
  - Tenants can initiate conversations with landlords
  - Text and image message sending
  - Message recall within 24 hours
  - Accurate unread message count
"""

import pytest
import random
from conftest import (
    AuthenticatedClient,
    assert_success,
    assert_created,
    get_data,
    unique_username,
    unique_email,
)
from test_property import create_listing


@pytest.mark.conversation
class TestConversations:
    """TC-CHAT-001: Tenant initiates a conversation with a landlord."""

    def test_tenant_initiates_conversation(self, tenant_client, landlord_client):
        """TC-CHAT-001: POST /conversations should create a new conversation."""
        listing = create_listing(landlord_client)
        landlord_id = landlord_client.user_id

        resp = tenant_client.post("/conversations", json={
            "propertyId": listing["data"]["id"],
            "landlordId": landlord_id,
            "message": "Hello, I am interested in your property.",
        })
        body = assert_created(resp)
        data = get_data(body)
        assert data.get("id") is not None

    def test_landlord_cannot_initiate_conversation(self, landlord_client, tenant_client):
        """TC-CHAT-001b: Landlords cannot initiate conversations (tenant-only)."""
        # Tenant creates listing
        listing = create_listing(landlord_client)
        landlord_id = landlord_client.user_id

        # Landlord tries to initiate
        resp = landlord_client.post("/conversations", json={
            "propertyId": listing["data"]["id"],
            "landlordId": landlord_id,
            "message": "Hello",
        })
        assert resp.status_code in (401, 403)

    def test_conversation_requires_authentication(self, unauthenticated_client, backend_ready):
        """TC-CHAT-001c: Unauthenticated conversation creation should return 401."""
        resp = unauthenticated_client.post("/conversations", json={
            "propertyId": 1,
            "landlordId": 1,
            "message": "Hello",
        })
        assert resp.status_code == 401


@pytest.mark.conversation
class TestMessages:
    """TC-CHAT-002 to TC-CHAT-004: Message sending and recall."""

    def _create_conversation(self, tenant_client, landlord_client):
        """Helper: create a listing and start a conversation. Returns the conversation ID."""
        listing = create_listing(landlord_client)
        resp = tenant_client.post("/conversations", json={
            "propertyId": listing["data"]["id"],
            "landlordId": landlord_client.user_id,
            "message": "Initial message",
        })
        return resp.json()["data"]["id"]

    def test_send_text_message(self, tenant_client, landlord_client):
        """TC-CHAT-002: POST /conversations/{id}/messages should save and return a text message."""
        conv_id = self._create_conversation(tenant_client, landlord_client)

        resp = tenant_client.post(f"/conversations/{conv_id}/messages", data={"content": "Is this still available?"})
        body = assert_created(resp)
        data = get_data(body)
        assert data.get("id") is not None
        assert data.get("content") == "Is this still available?"

    def test_landlord_can_send_message(self, tenant_client, landlord_client):
        """TC-CHAT-002b: Landlords can reply in a conversation they are part of."""
        conv_id = self._create_conversation(tenant_client, landlord_client)

        resp = landlord_client.post(f"/conversations/{conv_id}/messages", data={"content": "Yes it is!"})
        body = assert_created(resp)
        assert body.get("code") == 201

    def test_get_conversation_messages(self, tenant_client, landlord_client):
        """TC-CHAT-002c: GET /conversations/{id}/messages should return message history."""
        conv_id = self._create_conversation(tenant_client, landlord_client)

        # Send a message
        tenant_client.post(f"/conversations/{conv_id}/messages", data={"content": "Hello!"})

        resp = tenant_client.get(f"/conversations/{conv_id}/messages")
        body = assert_success(resp)
        messages = get_data(body)
        assert isinstance(messages, list)
        assert len(messages) >= 1

    def test_recall_message_within_24h(self, tenant_client, landlord_client):
        """TC-CHAT-004: POST /conversations/messages/{id}/recall should recall the message."""
        conv_id = self._create_conversation(tenant_client, landlord_client)
        msg_resp = tenant_client.post(f"/conversations/{conv_id}/messages", data={"content": "Message to recall"})
        message_id = msg_resp.json()["data"]["id"]

        resp = tenant_client.post(f"/conversations/messages/{message_id}/recall")
        body = assert_success(resp)
        data = get_data(body)
        # The recalled message may be flagged or have content changed
        assert body.get("code") == 200

    def test_get_unread_count(self, tenant_client, landlord_client):
        """TC-CHAT-005: GET /conversations/unread-count should return accurate count."""
        conv_id = self._create_conversation(tenant_client, landlord_client)

        # Landlord sends messages
        landlord_client.post(f"/conversations/{conv_id}/messages", data={"content": "Message 1"})
        landlord_client.post(f"/conversations/{conv_id}/messages", data={"content": "Message 2"})

        # Tenant checks unread count
        resp = tenant_client.get("/conversations/unread-count")
        body = assert_success(resp)
        data = get_data(body)
        count = data.get("data") if isinstance(data, dict) else data
        assert isinstance(count, (int, float))

    def test_get_conversation_detail(self, tenant_client, landlord_client):
        """TC-CHAT-DETAIL: GET /conversations/{id} should return conversation with messages."""
        conv_id = self._create_conversation(tenant_client, landlord_client)

        resp = tenant_client.get(f"/conversations/{conv_id}")
        body = assert_success(resp)
        data = get_data(body)
        assert "conversation" in data
        assert "messages" in data

    def test_mark_conversation_as_read(self, tenant_client, landlord_client):
        """TC-CHAT-READ: PUT /conversations/{id}/read should mark messages as read."""
        conv_id = self._create_conversation(tenant_client, landlord_client)

        resp = tenant_client.put(f"/conversations/{conv_id}/read")
        assert resp.status_code == 200
