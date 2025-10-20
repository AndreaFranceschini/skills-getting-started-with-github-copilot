from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Ensure one known activity exists
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "tester@example.com"

    # Ensure clean state: remove if already present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Sign up
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert res.json()["message"] == f"Signed up {email} for {activity}"
    assert email in activities[activity]["participants"]

    # Signing up again should fail
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 400

    # Unregister
    res = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert res.status_code == 200
    assert res.json()["message"] == f"Unregistered {email} from {activity}"
    assert email not in activities[activity]["participants"]
