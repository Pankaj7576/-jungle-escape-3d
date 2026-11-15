# Jungle Escape 3D — Player Login Setup

This branch now contains the first implementation of the account flow.

## Implemented in code

- Login gate before the game menu.
- Unity Player Accounts browser flow for email-based account sign-in and account creation.
- Username/password sign-up and returning-player login.
- Logout clears the local Authentication session.
- Returning signed-in players are restored from the cached Authentication session.
- Best score is stored locally per player and synchronized to that player's private Cloud Save data.
- Google and Facebook direct identity providers are intentionally deferred.

## Unity Dashboard steps still required

1. In the Unity Dashboard project **Jungle Escape 3D**, keep **Unity Player Accounts** and **Username and Password** enabled under Player Authentication > Identity Providers.
2. Open the Unity Player Accounts auth client and copy its **Client ID**. Put that value in:
   `Assets/Resources/UnityPlayerAccountSettings.asset`, field `clientId`.
   The Client ID is not a password or secret. Never put a client secret or account password in this file.
3. Enable **Cloud Save** for the project so the high-score sync can run.
4. Link the Unity project in `ProjectSettings/ProjectSettings.asset` to the existing Unity Cloud project. The known Project ID is:
   `e42882f8-3657-40d2-8402-de62e432998b`
   Do not create a second Unity Cloud project.
5. Before public release, add real Terms of Service and Privacy Policy URLs to the Player Accounts auth client and make the policy accessible in the game.

## Package versions

- `com.unity.services.authentication`: `3.8.1`
- `com.unity.services.cloudsave`: `3.4.2`

These versions are listed as released/compatible for Unity Editor 6000.0.

## Important validation status

The code and repository wiring have been updated, but this has **not** yet been compiled by Unity or verified in an Android build. Test the generated scene and the two login paths in Unity before treating login as complete. Cloud Save errors fall back to the local per-player high score until the service is enabled and linked.
