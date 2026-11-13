using System;
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
                Debug.Log("Jungle Escape: demo scene is ready for Android export.");
            }
            catch (Exception exception)
            {
                Debug.LogError("Jungle Escape PreExport exception type: " + exception.GetType().FullName);
                Debug.LogError("Jungle Escape PreExport exception message: " + exception.Message);
                Debug.LogError("Jungle Escape PreExport stack trace:\n" + exception.StackTrace);
                throw;
            }
        }
    }
}