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

## RetiZero image prediction

The workspace now sends JPEG/PNG bytes to `POST /predict/image` (matching Content-Type, maximum 10 MB, 32 pixels per side to 40 megapixels). `GET /retizero/health` reports image-model readiness independently from the numeric model. Images are decoded in memory and are not written to disk or logged. Configure your hosting proxy to disable request-body logging too.

The adapter uses the official `zeroshot.CLIPRModel`, LoRA rank 8, strict checkpoint loading, and upstream preprocessing (224 x 224, ImageNet normalization, RGB). It retains the 14 candidate labels from `Zeroshot.py`, including upstream spelling. Outputs are image-SHA256-bound disease rankings with uncalibrated softmax scores, NOT five-grade DR predictions, calibrated disease probabilities or lesion maps. Results can be downloaded separately from the dashboard. APTOS/IDRiD five-grade evaluation requires a separately trained/validated grading model.

Setup on a Python 3.10 inference host (the current local Python 3.12 environment only tests the API):

1. Clone https://github.com/LooKing9218/RetiZero outside this repository. The adapter was inspected against commit `d72aadc692fbe33b182c79711bccb397edffb419`; check out that revision.
2. Download the official `RetiZero.pth` checkpoint using the link in the upstream README. Use only trusted weights. Keep weights out of Git.
3. Create a Python 3.10 virtual environment and install `requirements-retizero.txt`. This retains upstream model dependency versions but uses a newer Pillow for the API. Checkpoint inference compatibility has NOT been verified. Resolve runtime compatibility on the inference host before declaring it ready.
4. Set `RETIZERO_SOURCE` to the absolute cloned repository directory and `RETIZERO_CHECKPOINT` to the absolute `.pth` path. Bio_ClinicalBERT/tokenizer assets are downloaded by upstream Transformers on initial model construction; provision its cache for offline use. Upstream automatically selects CUDA when available, otherwise CPU.
5. Run Uvicorn from `backend` with one worker to avoid duplicate model memory. Set `FRONTEND_ORIGINS=https://aritro123456.github.io` in production. Configure HTTPS and the frontend `VITE_API_URL` as above.

Missing assets or startup failures keep readiness false and prediction returns 503. The adapter computes a checkpoint SHA256 for model provenance. Tests use injected stub outputs only; no actual RetiZero performance or heatmap generation is claimed. Confirm upstream code/weight usage terms before redistribution.

Environment variables may be exported by your host, or loaded explicitly with `python -m uvicorn app.main:app --env-file .env`. Copy `.env.example` to `.env` and adjust paths; it is not auto-loaded.
