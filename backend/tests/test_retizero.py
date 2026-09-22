import hashlib
import io
import logging

from fastapi.testclient import TestClient
from PIL import Image
from app.main import app
from app.retizero import LABELS, MAX_BYTES, RetiZeroPredictor


def png():
    output = io.BytesIO()
    Image.new("RGB", (32, 32)).save(output, format="PNG")
    return output.getvalue()


def test_image_validation_and_unavailable(monkeypatch):
    monkeypatch.setattr(RetiZeroPredictor, "load", lambda self: None)
    with TestClient(app) as client:
        assert client.get("/retizero/health").json()["model_ready"] is False
        assert client.post("/predict/image", content=png(), headers={"content-type": "image/png"}).status_code == 503
        assert client.post("/predict/image", content=b"bad", headers={"content-type": "image/png"}).status_code == 422
        assert client.post("/predict/image", content=png(), headers={"content-type": "text/plain"}).status_code == 415
        assert client.post("/predict/image", content=b"x" * (MAX_BYTES + 1), headers={"content-type": "image/png"}).status_code == 413


def test_ranking_and_private_failure(monkeypatch, caplog):
    monkeypatch.setattr(RetiZeroPredictor, "load", lambda self: None)
    image = png()
    class FakeModel:
        def __call__(self, image, labels):
            assert labels == LABELS and image.mode == "RGB"
            return [1.0] + [0.0] * 13, None
    class BrokenModel:
        def __call__(self, image, labels):
            raise RuntimeError("SECRET_IMAGE_CONTENT")
    with TestClient(app) as client:
        predictor = client.app.state.retizero
        predictor.model = FakeModel()
        predictor.version = "test-only"
        assert client.get("/retizero/health").json()["model_ready"] is True
        response = client.post("/predict/image", content=image, headers={"content-type": "image/png"})
        assert response.status_code == 200
        result = response.json()
        assert result["imageSha256"] == hashlib.sha256(image).hexdigest()
        assert result["scoreType"] == "uncalibrated-softmax"
        assert result["scores"][0] == {"label": "Normal", "score": 1.0}
        assert len(result["scores"]) == 14
        predictor.model = BrokenModel()
        with caplog.at_level(logging.ERROR):
            response = client.post("/predict/image", content=image, headers={"content-type": "image/png"})
        assert response.status_code == 500
        assert response.json() == {"detail": "Image prediction failed"}
        assert "SECRET_IMAGE_CONTENT" not in caplog.text + response.text


def test_loading_failure_is_controlled(monkeypatch, caplog):
    def broken(self):
        raise RuntimeError("PRIVATE_CHECKPOINT_PATH")
    monkeypatch.setattr(RetiZeroPredictor, "load", broken)
    with caplog.at_level(logging.ERROR), TestClient(app) as client:
        assert client.get("/retizero/health").json()["model_ready"] is False
    assert "PRIVATE_CHECKPOINT_PATH" not in caplog.text
