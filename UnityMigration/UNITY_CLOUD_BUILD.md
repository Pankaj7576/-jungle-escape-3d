# Mobile-friendly Unity Android Cloud Build (preferred free route)

## Why this route
Unity Personal is activated by signing in to Unity Hub. Unity's current documentation says Personal licenses cannot be manually activated with the old .alf/.ulf method. Therefore, do not waste time looking for a .ulf file or putting Unity account passwords into GitHub Actions.

Use Unity Build Automation (Unity DevOps) instead. Unity's current Cloud Personal FAQ lists 5 GB DevOps storage and 200 Windows build minutes. The included minutes are limited; check usage in the Unity Cloud dashboard and do not opt into paid overages. The free tier cannot be assumed to cover unlimited builds.

Official references:
- https://docs.unity.com/en-us/hub/manage-license
- https://docs.unity.com/en-us/build-automation/get-started-with-build-automation/connect-your-version-control-system
- https://docs.unity.com/en-us/build-automation/basic-build-configuration/overview
- https://activation.unity3d.com/products/unity-cloud/faq

## Project facts
- Repository: https://github.com/Pankaj7576/-jungle-escape-3d
- Branch: unity-migration/phase-1
- Unity project subfolder: UnityMigration
- Pinned editor: 6000.0.60f1 (from UnityMigration/ProjectSettings/ProjectVersion.txt)
- Target: Android APK (not AAB for phone testing)

## Setup from an Android phone
1. Open https://cloud.unity.com/ and sign in with the same Unity ID used in Unity Hub.
2. Open DevOps, then Build Automation. If prompted, enable/start the free Unity DevOps/Build Automation tier. Do not add a payment method or opt into pay-as-you-go.
3. Open Source Control / Version Control setup. Choose GitHub. This repository is public, so Unity Build Automation may connect to it without a token; if it asks for authorization, grant only the minimum public-repository read access. Do not share your GitHub password.
4. Create a build configuration/target:
   - Name: Jungle Escape Android Test
   - Repository: Pankaj7576/-jungle-escape-3d
   - Branch: unity-migration/phase-1
   - Project subfolder path: UnityMigration
   - Unity version: enable Auto detect from ProjectVersion.txt, or choose 6000.0.60f1 if offered
   - Platform: Android
   - Build output: APK (leave the AAB option off)
   - Auto-build: Off initially, to save the free build minutes.
5. Save the target and start one manual build.
6. Watch Build History / Logs. If it succeeds, download the APK artifact and install it on Android. If it fails, share only the error text; never share passwords, tokens, or license files.

## Important limits and caveats
- Unity Personal activation date in Unity Hub means local Personal activation; it is not a CI license file.
- The current Unity manual says Personal licenses are activated by signing into Unity Hub; manual activation is not supported for Personal.
- Unity Build Automation is the preferred official cloud route for this project because it avoids trying to export a local Personal .ulf file to GitHub Actions.
- The free tier has a monthly build-minute/storage cap. Monitor usage. Do not enable paid overages or enter card details for this test.
- A successful build is not guaranteed until Unity actually imports and compiles this project's scripts/packages. If the editor version is unavailable, choose a supported Unity 6 version only after deliberately updating ProjectVersion and validating the project.
- No APK should be claimed until Build History reports success and an APK artifact is available.
