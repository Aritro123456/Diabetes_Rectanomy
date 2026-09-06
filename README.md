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
