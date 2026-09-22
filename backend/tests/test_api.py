from fastapi.testclient import TestClient

from app.main import app


VALID_INPUT = {
    "pregnancies": 2,
    "glucose": 110,
    "blood_pressure": 70,
    "skin_thickness": 20,
    "insulin": 80,
    "bmi": 24.5,
    "diabetes_pedigree_function": 0.4,
    "age": 35,
}


class FakeModel:
    model_version = "test-1"

    def predict(self, rows):
        return [1]

    def predict_proba(self, rows):
        return [[0.2, 0.8]]


def test_health_reports_missing_model():
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["model_ready"] is False


def test_predict_returns_controlled_error_without_model():
    with TestClient(app) as client:
        response = client.post("/predict", json=VALID_INPUT)
    assert response.status_code == 503
    assert response.json() == {"detail": "Prediction model is not available"}


def test_predict_with_loaded_model():
    with TestClient(app) as client:
        client.app.state.predictor.model = FakeModel()
        client.app.state.predictor.version = FakeModel.model_version
        response = client.post("/predict", json=VALID_INPUT)
    assert response.status_code == 200
    assert response.json() == {
        "prediction": 1,
        "risk": "high",
        "probability": 0.8,
        "model_version": "test-1",
    }


def test_invalid_inputs_are_rejected():
    with TestClient(app) as client:
        missing = client.post("/predict", json={})
        impossible = client.post("/predict", json={**VALID_INPUT, "age": 200})
        non_numeric = client.post("/predict", json={**VALID_INPUT, "bmi": "unknown"})
    assert missing.status_code == 422
    assert impossible.status_code == 422
    assert non_numeric.status_code == 422


def test_github_pages_cors_preflight():
    with TestClient(app) as client:
        response = client.options('/predict', headers={
            'Origin': 'https://aritro123456.github.io',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type',
        })
    assert response.status_code == 200
    assert response.headers['access-control-allow-origin'] == 'https://aritro123456.github.io'


def test_unknown_origin_is_not_allowed():
    with TestClient(app) as client:
        response = client.options('/predict', headers={
            'Origin': 'https://untrusted.example',
            'Access-Control-Request-Method': 'POST',
        })
    assert response.status_code == 400
    assert 'access-control-allow-origin' not in response.headers
