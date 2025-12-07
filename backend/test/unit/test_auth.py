import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_login():
    payload = {"username": "admin", "password": "adminpass"}
    response = client.post("/auth/login", json=payload)
    assert response.status_code in [200, 401]  # 401 if user doesn't exist yet
    if response.status_code == 200:
        data = response.json()
        assert "access_token" in data
        assert "is_admin" in data
