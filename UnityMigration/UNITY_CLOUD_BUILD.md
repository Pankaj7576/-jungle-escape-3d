# Mobile-friendly Unity Android Cloud Build

## Project facts

- Repository: https://github.com/Pankaj7576/-jungle-escape-3d
- Branch: `unity-migration/phase-1`
- Unity project subfolder: `UnityMigration`
- Pinned editor: `6000.0.60f1` (from `UnityMigration/ProjectSettings/ProjectVersion.txt`)
- Target: Android APK (not AAB for direct phone testing)

## Exact Quick target setup values

For the current Unity `6000.0.60f1` project, use these values when creating the Android target:

| Build Automation field | Value |
|---|---|
| Target name | `Jungle Escape Android` |
| Branch | `unity-migration/phase-1` |
| Project subfolder path | `UnityMigration` |
| Manually select Unity version | Off / use Auto-detect |
| Detected Unity version | `6000.0.60f1` |
| Platform | `Android` |
| Builder operating system | `Windows 11` |
| Builder OS version | `24H2` |
| Android SDK version | `36` (choose the highest available SDK version) |
| Build App Bundle (.aab) | Off — keep APK output |
| Auto-build | Off initially |

**Why Windows 11 24H2 and SDK 36:** Unity's current Build Automation supported-platform table lists Android support on Windows 11 24H2 (not Windows 11 22H2). For Unity 6000.0.60f1, the available SDK table lists SDK 34, 35 and 36; Build Automation requires selecting the maximum available SDK version, so choose 36.

If the UI does not offer Windows 11 24H2 or Android SDK 36, do not substitute a random value. Stop and capture the exact available options before saving.

## Source control

1. Open https://cloud.unity.com/ and sign in with the Unity ID linked to the existing project.
2. Open DevOps > Build Automation > Settings > Source Control.
3. Choose **GitHub** and select `Pankaj7576/-jungle-escape-3d`.
4. Keep the repository authorization read-only. Do not share the token or password in chat. Do not add webhook write permission while Auto-build is off.
5. If the Git Executable setting is shown for the Windows builder, keep **Native**. Unity documents Native as the default and recommended Windows Git client for new projects. Cygwin is only needed for specific Linux/macOS symlink compatibility.
6. Save Source Control before creating the target.

The repository is public, so Build Automation can also connect without a token when its public-repository detection succeeds. If the repository is already listed and the source-control page is saved, do not recreate the GitHub token unnecessarily.

## Create and run the first target

1. Open DevOps > Build Automation > Configurations and select **Quick target setup**.
2. Enter the values in the table above. The project subfolder is `UnityMigration` because that is where `Assets`, `Packages`, and `ProjectSettings` live.
3. Save/create the target.
4. Open that target's **Advanced settings**.
5. Under **Script hooks → Pre-Export Method**, enter exactly:
   `JungleEscape.EditorTools.CloudBuildHooks.PreExport`
   Do not add parentheses. This method is already in `Assets/Editor/CloudBuildHooks.cs`; it generates the missing demo scene, validates the scene wiring, runs six deterministic swipe-input regression cases, and registers `Assets/Scenes/JungleEscape_Demo.unity` in `EditorBuildSettings.scenes` before export.
6. Leave the target's custom **Scenes** override at its default/unset value so the generated Editor Build Settings scene list is used. Do not select a scene path before the pre-export hook has generated it.
7. Save Advanced settings. Keep Auto-build off to conserve free build minutes.
8. Start one manual build and inspect Build History and the complete build log.
9. If the build succeeds, download the APK artifact and install it on Android. If it fails, retain the exact first compiler/import/Gradle error; do not infer success from the target being saved.

**Important:** Creating/saving the target is not the same as running a build. The pre-export hook must be configured before the first manual build; otherwise the repository currently has no committed `Assets/Scenes` folder for Build Automation to select.

## Current source checks (2026-11-17)

- The Unity source branch is `unity-migration/phase-1`, latest inspected commit before this documentation update: `2bb00d8563f2c953075e61da3e6ffe248fa05a03`.
- The earlier `CS0104: Object is ambiguous` references in `Assets/Editor/ProjectBootstrap.cs` are now explicitly written as `UnityEngine.Object`. This removes that specific ambiguity from the inspected file, but a Unity Editor compile has not yet verified the whole project.
- `Assets/Scenes/JungleEscape_Demo.unity` is generated at build time by the pre-export hook; it is not currently committed.
- The Player Accounts settings asset contains a Client ID, but the project link is not confirmed in the repository because `ProjectSettings/ProjectSettings.asset` is absent. The Unity Editor must link the existing Cloud Project ID below and save the generated project settings; do not fabricate the file.

## Important limits and caveats

- The project currently includes `ProjectSettings/ProjectVersion.txt` but does not include `ProjectSettings/ProjectSettings.asset`. The Unity Cloud project link therefore remains unverified until the project is opened in Unity Editor and linked to the existing Project ID `e42882f8-3657-40d2-8402-de62e432998b`. Do not fabricate this generated settings file.
- Unity Personal is activated by signing in to Unity Hub. Do not try to export a legacy Personal `.ulf` file or put Unity account passwords into GitHub Actions.
- The optional `.github/workflows/unity-android.yml` uses GameCI and requires `UNITY_LICENSE`, `UNITY_EMAIL`, and `UNITY_PASSWORD` secrets. It is not the recommended route for this free Personal setup and must not be expected to build until a supported CI license has been verified.
- Unity Cloud Personal/DevOps quotas can change. Check the live dashboard usage and do not opt into paid overages.
- A successful Unity build is not guaranteed until Unity actually imports and compiles the scripts/packages. No Unity APK should be claimed until Build History reports success and an APK artifact is available.

## Official references

- Build configuration: https://docs.unity.com/en-us/build-automation/basic-build-configuration/overview
- Advanced settings and script hooks: https://docs.unity.com/en-us/build-automation/advanced-build-configuration/overview
- Pre-export method hook: https://docs.unity.cn/Manual/UnityCloudBuildPreAndPostExportMethods.html
- Android SDK versions in Build Automation: https://docs.unity.com/en-us/build-automation/reference/available-android-sdk-versions
- Supported builder operating systems: https://docs.unity.com/en-us/build-automation/reference/supported-platforms-on-each-builder-os
- Git executable options: https://docs.unity.com/en-us/build-automation/optimize-build-speed/choose-git-executable
- Unity Player Accounts setup: https://docs.unity.com/en-us/authentication/unity-player-accounts
