import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_create_leave():
    payload = {
        "employee_id": 1,
        "start_date": "2025-12-10",
        "end_date": "2025-12-12",
        "reason": "Medical",
        "status": "pending",
        "approved_by_admin": False,
    }
    response = client.post("/leave/leave", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["employee_id"] == payload["employee_id"]
    assert data["reason"] == payload["reason"]


def test_get_leaves():
    employee_id = 1
    response = client.get(f"/leave/leave/{employee_id}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_approve_leave():
    leave_id = 1
    response = client.put(f"/leave/leave/approve/{leave_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"
    assert data["approved_by_admin"] is True
