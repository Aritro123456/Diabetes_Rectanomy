from pathlib import Path
from typing import Any

import joblib

from .schemas import PredictionRequest, PredictionResponse


FEATURES = (
    "pregnancies",
    "glucose",
    "blood_pressure",
    "skin_thickness",
    "insulin",
    "bmi",
    "diabetes_pedigree_function",
    "age",
)


class ModelUnavailableError(RuntimeError):
    pass


class Predictor:
    def __init__(self, model_path: Path) -> None:
        self.model_path = model_path
        self.model: Any | None = None
        self.version: str | None = None

    @property
    def ready(self) -> bool:
        return self.model is not None

    def load(self) -> None:
        if not self.model_path.is_file():
            return
        self.model = joblib.load(self.model_path)
        self.version = str(getattr(self.model, "model_version", self.model_path.stem))

    def predict(self, request: PredictionRequest) -> PredictionResponse:
        if self.model is None or self.version is None:
            raise ModelUnavailableError("Prediction model is not available")

        row = [[getattr(request, name) for name in FEATURES]]
        prediction = int(self.model.predict(row)[0])
        probability = None
        if hasattr(self.model, "predict_proba"):
            probability = float(self.model.predict_proba(row)[0][1])

        return PredictionResponse(
            prediction=prediction,
            risk="high" if prediction == 1 else "low",
            probability=probability,
            model_version=self.version,
        )
