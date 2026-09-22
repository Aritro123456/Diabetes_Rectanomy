import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from .predictor import ModelUnavailableError, Predictor
from .schemas import HealthResponse, PredictionRequest, PredictionResponse


logger = logging.getLogger(__name__)
MODEL_PATH = Path(os.getenv("MODEL_PATH", Path(__file__).parents[1] / "models" / "model.joblib"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    predictor = Predictor(MODEL_PATH)
    try:
        predictor.load()
    except Exception:
        logger.exception("Failed to load prediction model")
    app.state.predictor = predictor
    yield


app = FastAPI(title="Diabetes Prediction API", version="1.0.0", lifespan=lifespan)

frontend_origins = os.getenv("FRONTEND_ORIGINS", os.getenv("FRONTEND_ORIGIN", "http://localhost:3000,http://127.0.0.1:3000,https://aritro123456.github.io"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend_origins.split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health", response_model=HealthResponse)
def health(request: Request) -> HealthResponse:
    predictor: Predictor = request.app.state.predictor
    return HealthResponse(model_ready=predictor.ready, model_version=predictor.version)


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest, request: Request) -> PredictionResponse:
    predictor: Predictor = request.app.state.predictor
    try:
        return predictor.predict(payload)
    except ModelUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed") from exc

