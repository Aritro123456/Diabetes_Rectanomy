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

## Next integration

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
