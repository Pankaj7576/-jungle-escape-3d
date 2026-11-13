# Jungle Escape 3D — The Lost Temple

A clean rebuild of the original mobile-first 3D endless runner.

**Current game release: `1.00`** — see [`VERSION`](VERSION) and [`CHANGELOG.md`](CHANGELOG.md). Each accepted update increments the release by `0.001` and gets a permanent rollback snapshot branch (`versions/<version>`). Version `1.00` is preserved at [`versions/1.00`](https://github.com/Pankaj7576/-jungle-escape-3d/tree/versions/1.00).

## Run locally
`npm install` then `npm run dev`.

## Build Android
`npm run build`, `npx cap add android` (first time), then `npx cap sync android`.
Open Android Studio with `npx cap open android`.

The GitHub Actions workflow builds a portrait Android debug APK on pushes to the development branch.