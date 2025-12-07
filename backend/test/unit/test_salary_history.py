import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_create_salary_history():
    payload = {
        "employee_id": 1,
        "amount": 60000.0,
        "date": "2025-12-06T10:00:00",
        "remarks": "Monthly salary",
    }
    response = client.post("/admin/salary-history", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["employee_id"] == payload["employee_id"]
    assert data["amount"] == payload["amount"]


def test_get_salary_history():
    employee_id = 1
    response = client.get(f"/admin/salary-history/{employee_id}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
