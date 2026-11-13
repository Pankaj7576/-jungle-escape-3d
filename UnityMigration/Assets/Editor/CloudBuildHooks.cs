using UnityEngine;

namespace JungleEscape.EditorTools
{
    /// <summary>Generates and validates the playable demo scene before Unity Build Automation exports the player.</summary>
    public static class CloudBuildHooks
    {
        public static void PreExport()
        {
            Debug.Log("Jungle Escape: generating the demo scene for Unity Build Automation.");
            ProjectBootstrap.BuildDemoScene();
            ProjectBootstrap.ValidateGeneratedScene();
            Debug.Log("Jungle Escape: demo scene is ready for Android export.");
        }
    }
}
