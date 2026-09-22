from typing import Literal

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    pregnancies: int = Field(ge=0, le=25)
    glucose: float = Field(gt=0, le=300)
    blood_pressure: float = Field(gt=0, le=250)
    skin_thickness: float = Field(ge=0, le=100)
    insulin: float = Field(ge=0, le=1000)
    bmi: float = Field(gt=0, le=100)
    diabetes_pedigree_function: float = Field(ge=0, le=5)
    age: int = Field(ge=1, le=120)


class PredictionResponse(BaseModel):
    prediction: int
    risk: Literal["low", "high"]
    probability: float | None = Field(default=None, ge=0, le=1)
    model_version: str


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    model_ready: bool
    model_version: str | None = None
