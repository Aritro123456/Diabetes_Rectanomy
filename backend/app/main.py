import hashlib
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from .retizero import RetiZeroPredictor, decode_image, MAX_BYTES

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
        logger.error("Failed to load prediction model")
    app.state.retizero = RetiZeroPredictor()
    try:
        app.state.retizero.load()
    except Exception:
        logger.error("RetiZero initialization failed; check checkpoint, source and dependencies")
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
        logger.error("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed") from exc



@app.get("/retizero/health", response_model=HealthResponse)
def retizero_health(request: Request):
    model = request.app.state.retizero
    return HealthResponse(model_ready=model.ready, model_version=model.version)


@app.post("/predict/image")
async def predict_image(request: Request):
    if request.headers.get("content-type", "").split(";")[0].lower() not in ("image/jpeg", "image/png"):
        raise HTTPException(415, "Send JPEG or PNG bytes with the matching Content-Type")
    data = bytearray()
    async for chunk in request.stream():
        if len(data) + len(chunk) > MAX_BYTES:
            raise HTTPException(413, "Image exceeds 10 MB")
        data.extend(chunk)
    try:
        image = await run_in_threadpool(decode_image, bytes(data))
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from None
    try:
        return await run_in_threadpool(request.app.state.retizero.predict, image, hashlib.sha256(data).hexdigest())
    except ModelUnavailableError:
        raise HTTPException(503, "RetiZero model unavailable; install its checkpoint and dependencies") from None
    except Exception:
        # Never include model exception text: it can contain input data.
        logger.error("RetiZero prediction failed")
        raise HTTPException(500, "Image prediction failed") from None
    finally:
        image.close()
