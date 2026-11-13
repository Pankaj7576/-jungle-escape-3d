# Jungle Escape 3D — The Lost Temple

A clean rebuild of the original mobile-first 3D endless runner.

## Run locally
`npm install` then `npm run dev`.

## Build Android
`npm run build`, `npx cap add android` (first time), then `npx cap sync android`.
Open Android Studio with `npx cap open android`.

The GitHub Actions workflow builds a portrait Android debug APK on pushes to the development branch.