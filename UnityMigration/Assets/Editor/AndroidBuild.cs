using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace JungleEscape.EditorTools
{
    public static class AndroidBuild
    {
        /// <summary>
        /// Applies the same Android identity, portrait, architecture and APK settings
        /// for both the local/GameCI build entry point and Unity Build Automation.
        /// </summary>
        public static void ConfigureAndroidPlayerSettings()
        {
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android, "com.jungleescape.losttemple");
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
            PlayerSettings.companyName = "Jungle Escape Studio";
            PlayerSettings.productName = "Jungle Escape 3D - The Lost Temple";
            PlayerSettings.bundleVersion = "0.1.0";
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.stripEngineCode = true;

            // Direct-install testing requires an APK, not a Play Store app bundle.
            EditorUserBuildSettings.buildAppBundle = false;

            Debug.Log("Jungle Escape Android settings applied: package=com.jungleescape.losttemple, portrait, ARM64, IL2CPP, APK.");
        }

        public static void Build()
        {
            ProjectBootstrap.BuildDemoScene();
            ProjectBootstrap.ValidateGeneratedScene();

            if (!EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android))
                throw new System.Exception("Could not switch the active Unity build target to Android.");

            ConfigureAndroidPlayerSettings();

            string output = Path.GetFullPath(Path.Combine(Application.dataPath, "../Builds/Android/JungleEscape.apk"));
            Directory.CreateDirectory(Path.GetDirectoryName(output));

            BuildPlayerOptions options = new BuildPlayerOptions
            {
                scenes = new[] { "Assets/Scenes/JungleEscape_Demo.unity" },
                locationPathName = output,
                target = BuildTarget.Android,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(options);
            if (report.summary.result != BuildResult.Succeeded)
            {
                Debug.LogError("Android build failed: " + report.summary.result +
                    " | errors: " + report.summary.totalErrors);
                throw new System.Exception("Unity Android build failed.");
            }

            Debug.Log("Android APK built: " + output + " | bytes: " + report.summary.totalSize);
        }
    }
}
