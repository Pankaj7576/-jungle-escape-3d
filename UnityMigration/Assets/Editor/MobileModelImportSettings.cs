using UnityEditor;
using UnityEngine;

namespace JungleEscape.EditorTools
{
    /// <summary>Applies conservative Android import defaults to generated FBX and the optional hero FBX.</summary>
    public sealed class MobileModelImportSettings : AssetPostprocessor
    {
        private void OnPreprocessModel()
        {
            ModelImporter importer = (ModelImporter)assetImporter;
            string path = assetPath.Replace('\\', '/');

            if (path.Contains("/Environment/Generated/"))
            {
                importer.importAnimation = false;
                importer.importCameras = false;
                importer.importLights = false;
                importer.importBlendShapes = false;
                importer.isReadable = false;
                importer.meshCompression = ModelImporterMeshCompression.Medium;
                importer.optimizeMeshPolygons = true;
                importer.optimizeMeshVertices = true;
                importer.importNormals = ModelImporterNormals.Import;
                importer.importTangents = ModelImporterTangents.CalculateMikk;
            }
            else if (path.Contains("/Characters/Animations/KinemIQ/"))
            {
                importer.importAnimation = true;
                importer.importCameras = false;
                importer.importLights = false;
                importer.meshCompression = ModelImporterMeshCompression.Medium;
                importer.animationType = ModelImporterAnimationType.Human;
                importer.avatarSetup = ModelImporterAvatarSetup.CreateFromThisModel;
            }
            else if (path.EndsWith("/Characters/Explorer_BlackSuit.fbx"))
            {
                importer.importAnimation = true;
                importer.importCameras = false;
                importer.importLights = false;
                importer.isReadable = false;
                importer.meshCompression = ModelImporterMeshCompression.Medium;
                importer.animationType = ModelImporterAnimationType.Human;
                importer.avatarSetup = ModelImporterAvatarSetup.CreateFromThisModel;
                importer.optimizeMeshPolygons = true;
                importer.optimizeMeshVertices = true;
                importer.importNormals = ModelImporterNormals.Import;
                importer.importTangents = ModelImporterTangents.CalculateMikk;
            }
        }
    }
}
