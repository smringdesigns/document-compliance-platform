import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)


def test_health():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_list_documents_empty():
    """Test listing documents when empty"""
    with patch("app.db.database.get_db") as mock_db:
        mock_session = MagicMock()
        mock_session.query.return_value.count.return_value = 0
        mock_session.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
        mock_db.return_value = mock_session
        
        response = client.get("/api/v1/documents/?page=1&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []


def test_list_documents_with_pagination():
    """Test pagination works correctly"""
    with patch("app.db.database.get_db") as mock_db:
        mock_session = MagicMock()
        mock_session.query.return_value.count.return_value = 25
        
        mock_doc = MagicMock()
        mock_doc.id = "test-id"
        mock_doc.filename = "test.pdf"
        mock_session.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_doc]
        mock_db.return_value = mock_session
        
        response = client.get("/api/v1/documents/?page=2&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 25
        assert data["page"] == 2
        assert data["limit"] == 10
