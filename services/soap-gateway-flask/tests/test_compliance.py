import pytest
from unittest.mock import patch, MagicMock
import sys
import os

# Agregar app a path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.app import app


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_health(client):
    """Test health check endpoint"""
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['status'] == 'ok'


def test_compliance_check_missing_document_type(client):
    """Test compliance check rejects missing document_type"""
    response = client.post(
        '/api/v1/compliance/check',
        json={'document_id': 'test-123'}
    )
    assert response.status_code == 400
    assert 'error' in response.json


def test_compliance_check_with_valid_document_type(client):
    """Test compliance check with financial_report (should be COMPLIANT)"""
    with patch('requests.post') as mock_post:
        # Mock SOAP response
        mock_response = MagicMock()
        mock_response.text = '''<?xml version="1.0"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:comp="http://government.example.com/compliance">
  <soapenv:Body>
    <comp:VerifyComplianceResponse>
      <comp:Status>COMPLIANT</comp:Status>
      <comp:CheckId>check-123</comp:CheckId>
      <comp:Details>OK</comp:Details>
      <comp:CheckedAt>2024-01-01T00:00:00Z</comp:CheckedAt>
    </comp:VerifyComplianceResponse>
  </soapenv:Body>
</soapenv:Envelope>'''
        mock_post.return_value = mock_response
        
        with patch('app.app.save_compliance_check') as mock_save:
            response = client.post(
                '/api/v1/compliance/check',
                json={
                    'document_id': 'doc-123',
                    'document_type': 'financial_report'
                }
            )
            assert response.status_code == 200
            data = response.json
            assert data['status'] == 'COMPLIANT'


def test_compliance_status_not_found(client):
    """Test getting compliance status for non-existent document"""
    with patch('app.app.get_db') as mock_db:
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = None
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        response = client.get('/api/v1/compliance/status/non-existent')
        assert response.status_code == 404
