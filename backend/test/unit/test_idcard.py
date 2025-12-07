import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_create_id_card():
    payload = {
        "employee_id": 1,
        "name": "John Doe",
        "designation": "Developer",
        "department": "IT",
        "issue_date": "2025-12-01",
        "expiry_date": "2026-12-01",
        "card_number": "ID123456",
    }
    response = client.post("/admin/id-card", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["employee_id"] == payload["employee_id"]
    assert data["card_number"] == payload["card_number"]


def test_get_id_cards():
    employee_id = 1
    response = client.get(f"/admin/id-card/{employee_id}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
