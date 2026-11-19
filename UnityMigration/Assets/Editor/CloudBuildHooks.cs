using System;
using UnityEditor;
using UnityEngine;

namespace JungleEscape.EditorTools
{
    /// <summary>Generates and validates the playable demo scene before Unity Build Automation exports the player.</summary>
    public static class CloudBuildHooks
    {
        public static void PreExport()
        {
            Debug.Log("Jungle Escape: PreExport started; generating the demo scene.");
            try
            {
                ProjectBootstrap.BuildDemoScene();
                Debug.Log("Jungle Escape: demo scene generation completed; validating scene.");
                ProjectBootstrap.ValidateGeneratedScene();

                if (EditorUserBuildSettings.activeBuildTarget != BuildTarget.Android)
                    throw new InvalidOperationException(
                        "Jungle Escape Android PreExport requires the active build target to be Android, but it is " +
                        EditorUserBuildSettings.activeBuildTarget + ".");

                AndroidBuild.ConfigureAndroidPlayerSettings();
                Debug.Log("Jungle Escape: Android identity, portrait orientation, ARM64, IL2CPP and APK output settings are ready.");
                Debug.Log("Jungle Escape: demo scene and Android player settings are ready for export.");
            }
            catch (Exception exception)
            {
                Debug.LogError("Jungle Escape PreExport exception type: " + exception.GetType().FullName);
                Debug.LogError("Jungle Escape PreExport exception message: " + exception.Message);
                Debug.LogError("Jungle Escape PreExport stack trace:\n" + exception.StackTrace);
                Debug.LogException(exception);
                throw;
            }
        }
    }
}
