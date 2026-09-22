# Diabetes Prediction API

Run from this directory:

```powershell
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
.venv/Scripts/python.exe -m uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`; interactive documentation is at `/docs`.
Until `models/model.joblib` is supplied, `/health` reports `model_ready: false` and `/predict` returns HTTP 503.

The prediction is informational and is not a medical diagnosis.

## Frontend connection

Open the dashboard's **Diabetes API** tab and check the backend URL. Local development defaults to `http://127.0.0.1:8000`. The form posts eight numeric measurements to `/predict`; this backend cannot process retinal images.

For GitHub Pages, host this Python service separately with HTTPS. Set the repository Actions variable `VITE_API_URL` to its public base URL and rerun the Pages workflow, or enter the URL in the dashboard. Start the hosted service from `backend` with `python -m uvicorn app.main:app --host 0.0.0.0 --port <host-port>`.

`FRONTEND_ORIGINS` accepts comma-separated origins; defaults include `https://aritro123456.github.io` and localhost port 3000. Origins must not include `/Diabetes_Rectanomy/`. `FRONTEND_ORIGIN` remains supported as a fallback.

Supply a trusted model at `models/model.joblib` or set `MODEL_PATH`, install the model's training-compatible runtime dependencies, then restart. The model must accept the eight features in `app/predictor.py` order and return binary labels 0/1; its second probability column must represent class 1. Include required preprocessing in the saved pipeline. Do not load untrusted joblib files.

Run `.venv/Scripts/python.exe -m pytest tests -q` here. A successful prediction is tested using an injected test model only; no trained model is bundled.
