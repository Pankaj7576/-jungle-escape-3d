# Jungle Escape 3D — Version History

## 1.00
- Baseline snapshot: Himalayan valley scenery, modern suspension bridge, and refined jump/slide obstacles.
- Rollback snapshot branch: `versions/1.00`.

## Versioning rule
- Keep the current release number in the root `VERSION` file.
- Increase the final numeric part by 0.001 for every accepted game update: `1.00` → `1.001` → `1.002` → `1.003`.
- Every release must have a matching snapshot branch named `versions/<version>` pointing to that release's exact commit.
- Add a dated/numbered changelog entry describing the update and its build status.
- Never overwrite or delete old version snapshot branches. To roll back, restore `main` to the selected snapshot commit/branch after confirming the requested version.
