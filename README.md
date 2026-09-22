# RetinaReview

Frontend research prototype adapted from MotionSites' free AI Runtime visual reference by Ritu: https://motionsites.ai/?prompt=ai-runtime
Original implementation: dark review workspace, mint accents, pill navigation, subtle entrance motion. No premium template assets or medical images are bundled.

## Run

`npm install`

`npm run dev`

## Validate

`npm run build`

`npx tsc --noEmit`

`node --experimental-strip-types check.mjs`

## Current behavior

- Search/filter sample and locally opened cases.
- JPEG/PNG preview, file checks, zoom, manual assessment, notes, JSON export.
- Images and reviews stay in browser memory; refresh clears the session.
- Sample grading is explicitly illustrative. Uploads never receive fabricated predictions.
- Evaluation page shows missing results instead of invented metrics.

## Backend integration

The **Diabetes API** dashboard tab connects to `GET /health` and `POST /predict` in the FastAPI service under `backend`. It validates eight numeric measurements, checks model readiness, and displays actual backend results or errors. This numeric diabetes classifier is separate from retinal review; it cannot generate DR grades or image heatmaps.

See [backend setup](backend/README.md). Locally run both servers and use `http://127.0.0.1:8000`. For the public site, set the GitHub Actions repository variable `VITE_API_URL` to your separately hosted HTTPS API and rerun deployment, or enter its URL in the dashboard. For local frontend builds, set the `VITE_API_URL` environment variable before starting/building. Numeric measurements leave the browser only when submitted to the selected API; they are not stored by the frontend.

Run `node --experimental-strip-types check-diabetes-api.mjs` for client validation and response checks. Optionally set `API_TEST_URL` to test against a running backend. No hosted API URL or trained model has been supplied; public inference remains unavailable until both exist.

## Retinal inference

Connect a separately hosted inference API with shared preprocessing, authenticated case storage, and measured held-out evaluation. This frontend does not run RETFound or RetiZero and is not a clinically validated medical device.

## Verification limits

Build, type checking, image-validation self-check, and HTTP preview checked. Browser interaction/visual QA was not requested. Optional WebMCP case navigation is feature-detected; no supported validation context was established.

## Landing page
The homepage uses the supplied liquid-glass recreation reference, Instrument Serif, and the supplied ambient video URLs. The original review workspace is at /dashboard. Videos respect reduced-motion preferences, can be paused, and stop off-screen. External video/font availability depends on their hosts.

Run `node check-landing.mjs` while the development server is active to verify both routes.


## Research features

- Quality checker: local canvas analysis at up to 512 px; exposure, contrast, Laplacian variance, illuminated area, clipping, and original resolution. Fixed thresholds are unvalidated and do not confirm fundus content or clinical gradability.
- Confidence and explainability: import a JSON prediction bound to the original file SHA-256. Five probabilities must sum to one. Optional heatmap values are a 2–256 by 2–256 rectangular grid in [0,1], inverse-mapped to the full original image. Attribution is not lesion segmentation.
- Reports: generates a structured research report using actual available fields; download text or print/save PDF. No generated treatment recommendations. Reports include declared model/calibration provenance and reviewer findings separately.
- Evaluation: import up to 20 runs / 100,000 rows total / 15 MB JSON. Calculate QWK, five-class macro F1, accuracy, MAE, ten-bin ECE, per-grade recall and a confusion matrix. Undefined quantities are labeled.
- Ablations: deltas only for identical dataset, split, cohort, external status, case IDs and true labels. No claim of statistical significance or matched training hyperparameters.
- IDRiD: filter imported runs declared external with dataset IDRiD. The app does not download IDRiD, train a model, or independently establish external validity or absence of leakage.
- Error analysis: filter undergrading, overgrading, two-grade-or-larger errors, true grade, ID, and confidence; export every matching row. UI caps display at 100 rows.

The import schemas and a downloadable synthetic evaluation example are available in the dashboard. No model checkpoint was provided; inference, model-generated attribution and actual IDRiD results remain external prerequisites. All inputs stay in browser memory; refreshing clears data.

Run `node --experimental-strip-types check-analysis.mjs` for import validation, metric edge cases, quality and report checks. Browser interaction QA could not run because the computer-use runtime failed to initialize in the Windows sandbox.

## GitHub Pages

Live site: https://aritro123456.github.io/Diabetes_Rectanomy/
Dashboard: https://aritro123456.github.io/Diabetes_Rectanomy/dashboard/

`npm run build:pages` builds the existing React screens as two static Vite entry points in `dist-pages`. `node check-pages.mjs` verifies the entry points and base-prefixed assets. Pushes to main run `.github/workflows/pages.yml` to test, build and deploy using GitHub Actions. The repository Pages source must be GitHub Actions.

The original `npm run dev` / `npm run build` commands remain available for the existing Sites setup. GitHub Pages is public static hosting; no server, authentication, patient data or model inference is deployed. Uploaded images and review records remain browser-local.

## RetiZero image API

A RetiZero connection panel is available below the workspace image viewer. Open an image, check the API, then explicitly send it for inference. Results are separate 14-label disease rankings; they do not overwrite five-grade DR findings or evaluation data. The image leaves the browser only on explicit submission. See [RetiZero setup](backend/README.md#retizero-image-prediction). Official weights, a compatible runtime, and a hosted HTTPS API remain prerequisites. The adapter and failure paths are tested with stubs; actual checkpoint inference has not been run.
