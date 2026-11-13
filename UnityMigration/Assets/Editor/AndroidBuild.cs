using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace JungleEscape.EditorTools
{
    public static class AndroidBuild
    {
        public static void Build()
        {
            ProjectBootstrap.BuildDemoScene();

            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android);
            EditorUserBuildSettings.buildAppBundle = false;
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, "com.jungleescape.losttemple");
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
            PlayerSettings.companyName = "Jungle Escape Studio";
            PlayerSettings.productName = "Jungle Escape 3D - The Lost Temple";
            PlayerSettings.bundleVersion = "0.1.0";
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.stripEngineCode = true;

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
