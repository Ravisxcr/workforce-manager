import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_create_salary_slip():
    payload = {
        "employee_id": 1,
        "month": "December",
        "year": 2025,
        "basic": 50000.0,
        "hra": 10000.0,
        "allowances": 2000.0,
        "deductions": 1500.0,
        "net_pay": 60500.0,
        "date_generated": "2025-12-06",
    }
    response = client.post("/admin/salary-slip", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["employee_id"] == payload["employee_id"]
    assert data["month"] == payload["month"]
    assert data["net_pay"] == payload["net_pay"]


def test_get_salary_slips():
    employee_id = 1
    response = client.get(f"/admin/salary-slip/{employee_id}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
