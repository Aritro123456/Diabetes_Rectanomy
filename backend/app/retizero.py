"""Adapter for the official RetiZero zero-shot wrapper; no image persistence."""
import hashlib
import io
import math
import os
import sys
import threading
from pathlib import Path

from PIL import Image, UnidentifiedImageError
from .predictor import ModelUnavailableError

# Match the candidate prompts in upstream Zeroshot.py, including its spelling.
LABELS = ["Normal", "Retinal Vein Occlusion", "Central Serous Chorioretinopathy",
          "Non-proliferative Diabetic Retinopathy", "Proliferative Diabetic Retinopathy",
          "Epiretinal Membrane", "Glaucoma", "Macular Hole", "Pathologic Maculopathy",
          "Retinal Artery Occulusion", "Retinal Detachment", "Retinitis Pigmentosa",
          "Vogt-Koyanagi-Harada (VKH) disease", "Age-related Macular Degeneration"]
MAX_BYTES = 10 * 1024 * 1024


def decode_image(data: bytes):
    try:
        image = Image.open(io.BytesIO(data))
        if image.format not in ("JPEG", "PNG"):
            raise ValueError("Only JPEG and PNG images are supported")
        if min(image.size) < 32 or image.width * image.height > 40_000_000:
            raise ValueError("Image must be at least 32 pixels per side and at most 40 megapixels")
        image.load()
        return image.convert("RGB")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ValueError("Invalid or oversized image") from exc


class RetiZeroPredictor:
    def __init__(self):
        self.model = None
        self.version = None
        # ponytail: serialize GPU inference; scale with separate workers if throughput warrants it.
        self.lock = threading.Lock()

    @property
    def ready(self):
        return self.model is not None

    def load(self):
        checkpoint = Path(os.getenv("RETIZERO_CHECKPOINT", "models/RetiZero.pth"))
        source = os.getenv("RETIZERO_SOURCE")
        if not checkpoint.is_file() or not source:
            return
        source = Path(source).resolve()
        if not (source / "zeroshot" / "__init__.py").is_file():
            raise ValueError("RetiZero source directory is missing")
        sys.path.insert(0, str(source))
        import torch
        from zeroshot import CLIPRModel
        model = CLIPRModel(vision_type="lora", from_checkpoint=False,
                           weights_path=str(checkpoint), R=8)
        state = torch.load(str(checkpoint), map_location="cpu", weights_only=True)
        model.load_state_dict(state, strict=True)
        model.eval()
        with checkpoint.open("rb") as stream:
            digest = hashlib.sha256()
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(chunk)
        self.version = "RetiZero-sha256:" + digest.hexdigest()
        self.model = model

    def predict(self, image, image_hash):
        if not self.ready:
            raise ModelUnavailableError("RetiZero model unavailable")
        with self.lock:
            scores, _ = self.model(image, LABELS)
        values = [float(value) for value in scores]
        if (len(values) != len(LABELS) or any(not math.isfinite(v) or v < 0 or v > 1 for v in values)
                or abs(sum(values) - 1) > 0.0001):
            raise ValueError("Invalid model output")
        return {"imageSha256": image_hash, "model": self.version,
                "task": "zero-shot-disease-ranking", "scoreType": "uncalibrated-softmax",
                "scores": [{"label": label, "score": score} for label, score in zip(LABELS, values)]}
