# Jungle Escape 3D — Player Login Setup

## Current repository verification — 2026-11-16

- The Player Accounts settings asset at `Assets/Resources/UnityPlayerAccountSettings.asset` already contains a non-empty Client ID. Do not replace it unless the Unity Dashboard Auth Client has changed.
- This branch contains `ProjectSettings/ProjectVersion.txt` pinned to Unity `6000.0.60f1`, but it does not contain `ProjectSettings/ProjectSettings.asset`. The Unity Cloud project link therefore cannot be confirmed from the repository. Open `UnityMigration` in Unity Editor, sign in with the intended Unity ID, and link the existing Cloud Project ID below. Do not create a second Unity Cloud project.
- Existing Cloud Project ID: `e42882f8-3657-40d2-8402-de62e432998b`.
- Enable Cloud Save in the Unity Dashboard. If it is not enabled, the current code keeps the best score locally and logs a warning; cloud score sync is not complete.
- The login implementation uses Unity Player Accounts in the system browser, then Unity Authentication. Email/password and Google are available through the Player Accounts page when configured on that Player Accounts client. Facebook remains deferred.
- The Unity login code has not yet been compiled in Unity Editor or verified in a Unity Android APK. The verified Android APK in the root Three.js/Capacitor release does not contain this separate Unity login flow.

## Implemented in code

- Login gate before the game menu.
- Unity Player Accounts browser sign-in and account creation via `StartSignInAsync(false/true)`.
- The Player Accounts access token is exchanged with Unity Authentication via `SignInWithUnityAsync`; the service either creates a new UGS player or restores the player associated with that account.
- Logout clears the Unity Authentication session and signs out of Player Accounts.
- Returning UGS players are restored from a cached Authentication session. The code checks `SessionTokenExists` before calling `SignInAnonymouslyAsync`; Unity documents that this method restores the cached player regardless of whether the original sign-in used an external provider, and creates an anonymous player only when no cached player token exists.
- Best score is stored locally per player and synchronized to that player's private Cloud Save data.
- Google is supported through the Unity Player Accounts page if enabled on the Player Accounts client. A separate direct Google SDK integration and Facebook are not implemented.

## Unity Dashboard steps still required

1. In the Unity Dashboard project **Jungle Escape 3D**, add/enable **Unity Player Accounts** under Player Authentication > Identity Providers. This code uses the Unity Player Accounts provider; it does **not** call the separate UGS Username and Password APIs, so do not enable that separate provider just for this flow.
2. In the Unity Player Accounts auth client, configure the sign-in methods you want players to use (email/password and Google, if available for the client). Copy the **Client ID** into `Assets/Resources/UnityPlayerAccountSettings.asset`, field `clientId`. The Client ID is not a password or secret. Never put a client secret or account password in this file.
3. Enable **Cloud Save** for the project so high-score synchronization can run.
4. Open `UnityMigration` in Unity Editor, sign in with the intended Unity ID, and link the project to the existing Unity Cloud project. The known Project ID is `e42882f8-3657-40d2-8402-de62e432998b`. Do not create a second Unity Cloud project. Save the project so Unity writes its generated ProjectSettings file.
5. Before public release, add real Terms of Service and Privacy Policy URLs to the Player Accounts auth client and make the policy accessible in the game.

## Package versions

- `com.unity.services.authentication`: `3.8.1`
- `com.unity.services.cloudsave`: `3.4.2`

These versions are pinned in `Packages/manifest.json` for the Unity 6000.0 project.

## Important validation status

The code and repository wiring have been inspected, but this has **not** yet been compiled by Unity or verified in an Android build. Test the generated scene and both Player Accounts sign-in paths in Unity before treating login as complete. Cloud Save errors fall back to the local per-player best score until the service is enabled and the project is linked.
