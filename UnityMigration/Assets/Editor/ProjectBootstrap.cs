using System.Collections.Generic;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace JungleEscape.EditorTools
{
    /// <summary>
    /// Builds a deterministic playable greybox scene and reusable track prefabs.
    /// Run from Unity: Tools > Jungle Escape > Generate Demo Scene.
    /// Art is intentionally placeholder geometry; replace it with licensed production assets.
    /// </summary>
    public static class ProjectBootstrap
    {
        private const string Root = "Assets/JungleEscapeGenerated";
        private const string Prefabs = Root + "/Prefabs";
        private const string Materials = Root + "/Materials";
        private const string Scenes = "Assets/Scenes";

        [MenuItem("Tools/Jungle Escape/Generate Demo Scene")]
        public static void BuildDemoScene()
        {
            EnsureFolders();
            EnsureUrpPipeline();
            Material stone = MakeMaterial("Weathered Stone", new Color(0.31f, 0.29f, 0.25f));
            Material trim = MakeMaterial("Carved Stone", new Color(0.20f, 0.19f, 0.17f));
            Material moss = MakeMaterial("Moss", new Color(0.10f, 0.19f, 0.08f));
            Material heroMat = MakeMaterial("Explorer Dark Outfit", new Color(0.035f, 0.045f, 0.055f));
            Material skin = MakeMaterial("Explorer Skin", new Color(0.42f, 0.27f, 0.19f));
            Material beastMat = MakeMaterial("Guardian Charcoal Fur", new Color(0.025f, 0.022f, 0.02f));
            Material gold = MakeMaterial("Ancient Gold", new Color(0.85f, 0.55f, 0.10f));

            TrackSegment straight = BuildTrackPrefab("Bridge_Straight", ModuleKind.Straight, stone, trim, moss);
            TrackSegment left = BuildTrackPrefab("Bridge_Turn_Left_90", ModuleKind.Left, stone, trim, moss);
            TrackSegment right = BuildTrackPrefab("Bridge_Turn_Right_90", ModuleKind.Right, stone, trim, moss);
            TrackSegment gap = BuildTrackPrefab("Bridge_Broken_Gap", ModuleKind.Gap, stone, trim, moss);

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject trackRoot = new GameObject("TrackDirector");
            TrackDirector director = trackRoot.AddComponent<TrackDirector>();

            GameObject runner = BuildHero(heroMat, skin);
            runner.name = "Runner_Explorer";
            runner.transform.position = new Vector3(0f, 0.02f, 2f);
            RunnerMotor motor = runner.AddComponent<RunnerMotor>();
            RunnerAnimationDriver animation = runner.AddComponent<RunnerAnimationDriver>();
            Assign(animation, "motor", motor);

            GameObject guardian = BuildGuardian(beastMat);
            guardian.transform.position = new Vector3(0f, 0.02f, -3.5f);
            GuardianChase chase = guardian.AddComponent<GuardianChase>();

            GameObject cameraObject = new GameObject("Main Camera");
            cameraObject.tag = "MainCamera";
            Camera camera = cameraObject.AddComponent<Camera>();
            camera.fieldOfView = 62f;
            camera.nearClipPlane = 0.08f;
            cameraObject.AddComponent<AudioListener>();
            RunnerCamera follow = cameraObject.AddComponent<RunnerCamera>();

            GameObject lightObject = new GameObject("Directional Light");
            Light sun = lightObject.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.intensity = 1.15f;
            lightObject.transform.rotation = Quaternion.Euler(48f, -32f, 0f);
            RenderSettings.ambientLight = new Color(0.42f, 0.43f, 0.40f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.28f, 0.32f, 0.29f);
            RenderSettings.fogDensity = 0.008f;

            GameObject manager = new GameObject("GameManager");
            RunProgress progress = manager.AddComponent<RunProgress>();
            SwipeInput input = manager.AddComponent<SwipeInput>();
            GameBootstrap game = manager.AddComponent<GameBootstrap>();

            if (Object.FindObjectOfType<EventSystem>() == null)
                new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));

            Canvas canvas = CreateCanvas();
            UIFlow ui = canvas.gameObject.AddComponent<UIFlow>();
            BuildUI(canvas.transform, ui, game, progress);

            Assign(director, "runner", runner.transform);
            Assign(director, "startSegmentPrefab", straight);
            Assign(director, "straightPrefabs", new Object[] { straight });
            Assign(director, "leftTurnPrefabs", new Object[] { left });
            Assign(director, "rightTurnPrefabs", new Object[] { right });
            Assign(director, "gapPrefabs", new Object[] { gap });
            Assign(director, "segmentsAhead", 8);
            Assign(director, "keepBehind", 2);
            Assign(director, "turnChance", 0.10f);
            Assign(director, "gapChance", 0.08f);

            Assign(motor, "track", director);
            Assign(motor, "laneWidth", 2.0f);
            Assign(motor, "forwardSpeed", 9.5f);
            Assign(motor, "jumpVelocity", 7.3f);
            Assign(motor, "gravity", -21f);

            Assign(chase, "runner", runner.transform);
            Assign(chase, "desiredGap", 5.8f);
            Assign(follow, "target", runner.transform);
            Assign(follow, "obstructionMask", ~(1 << 2));
            Assign(progress, "runner", runner.transform);
            Assign(input, "runner", motor);
            Assign(game, "runner", motor);
            Assign(game, "guardian", chase);
            Assign(game, "runnerCamera", follow);
            Assign(game, "runProgress", progress);
            Assign(game, "track", director);
            Assign(game, "ui", ui);
            Assign(ui, "game", game);
            Assign(ui, "progress", progress);
            motor.SetFallHandler(game.OnRunnerCaught);
            chase.SetCaughtHandler(game.OnRunnerCaught);

            BuildDemoPickups(progress, ui, game, gold);
            BuildDemoHazard(game, trim);
            BuildEnvironmentDressing(stone, moss);

            string scenePath = Scenes + "/JungleEscape_Demo.unity";
            EditorSceneManager.SaveScene(scene, scenePath);
            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(scenePath, true)
            };
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Selection.activeObject = AssetDatabase.LoadAssetAtPath<SceneAsset>(scenePath);
            Debug.Log("Jungle Escape demo scene generated. Open Assets/Scenes/JungleEscape_Demo.unity and press Play.");
        }

        private enum ModuleKind { Straight, Left, Right, Gap }

        private static void EnsureFolders()
        {
            CreateFolder("Assets", "JungleEscapeGenerated");
            CreateFolder(Root, "Prefabs");
            CreateFolder(Root, "Materials");
            CreateFolder(Root, "Settings");
            CreateFolder("Assets", "Scenes");
        }

        private static void EnsureUrpPipeline()
        {
            const string pipelinePath = Root + "/Settings/JungleEscape_URP.asset";
            const string rendererPath = Root + "/Settings/JungleEscape_Renderer.asset";
            UniversalRenderPipelineAsset pipeline = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(pipelinePath);
            if (pipeline == null)
            {
                pipeline = ScriptableObject.CreateInstance<UniversalRenderPipelineAsset>();
                ScriptableRendererData renderer = pipeline.LoadBuiltinRendererData();
                if (renderer == null)
                    throw new System.InvalidOperationException("Unity could not create the default URP renderer data.");

                AssetDatabase.CreateAsset(renderer, rendererPath);
                SerializedObject serialized = new SerializedObject(pipeline);
                SerializedProperty rendererList = serialized.FindProperty("m_RendererDataList");
                if (rendererList == null)
                    throw new System.InvalidOperationException("URP renderer list property is missing.");
                rendererList.arraySize = 1;
                rendererList.GetArrayElementAtIndex(0).objectReferenceValue = renderer;
                serialized.ApplyModifiedPropertiesWithoutUndo();
                pipeline.renderScale = 0.9f;
                pipeline.msaaSampleCount = 2;
                pipeline.shadowDistance = 35f;
                pipeline.supportsHDR = false;
                pipeline.supportsCameraOpaqueTexture = false;
                pipeline.supportsCameraDepthTexture = false;
                AssetDatabase.CreateAsset(pipeline, pipelinePath);
            }

            GraphicsSettings.defaultRenderPipeline = pipeline;
            int previousQuality = QualitySettings.GetQualityLevel();
            for (int i = 0; i < QualitySettings.names.Length; i++)
            {
                QualitySettings.SetQualityLevel(i, false);
                QualitySettings.renderPipeline = pipeline;
            }
            QualitySettings.SetQualityLevel(previousQuality, false);
            EditorUtility.SetDirty(pipeline);
            AssetDatabase.SaveAssets();
        }

        private static void CreateFolder(string parent, string child)
        {
            string path = parent + "/" + child;
            if (!AssetDatabase.IsValidFolder(path)) AssetDatabase.CreateFolder(parent, child);
        }

        private static Material MakeMaterial(string name, Color color)
        {
            string path = Materials + "/" + name.Replace(" ", "_") + ".mat";
            Material existing = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (existing != null) return existing;
            Shader shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null) shader = Shader.Find("Standard");
            Material material = new Material(shader);
            material.name = name;
            material.color = color;
            AssetDatabase.CreateAsset(material, path);
            return material;
        }

        private static TrackSegment BuildTrackPrefab(string name, ModuleKind kind,
            Material stone, Material trim, Material moss)
        {
            GameObject root = new GameObject(name);
            List<Vector3> path = BuildPath(kind);
            AddDeck(root.transform, path, kind == ModuleKind.Gap, stone);
            AddRails(root.transform, path, trim, moss);
            Vector3 entryForward = Vector3.forward;
            Vector3 exitForward = kind == ModuleKind.Left ? Vector3.left :
                kind == ModuleKind.Right ? Vector3.right : Vector3.forward;
            Transform entry = Anchor(root.transform, "Entry", path[0], entryForward);
            Transform exit = Anchor(root.transform, "Exit", path[path.Count - 1], exitForward);
            Transform[] nodes = new Transform[Mathf.Max(0, path.Count - 2)];
            for (int i = 1; i < path.Count - 1; i++)
                nodes[i - 1] = Anchor(root.transform, "PathNode_" + i.ToString("00"),
                    path[i], path[i + 1] - path[i]);
            TrackSegment segment = root.AddComponent<TrackSegment>();
            Assign(segment, "entry", entry);
            Assign(segment, "exit", exit);
            Assign(segment, "pathNodes", nodes);
            Assign(segment, "isGapSegment", kind == ModuleKind.Gap);

            string pathName = Prefabs + "/" + name + ".prefab";
            GameObject prefab = PrefabUtility.SaveAsPrefabAsset(root, pathName);
            Object.DestroyImmediate(root);
            return prefab.GetComponent<TrackSegment>();
        }

        private static List<Vector3> BuildPath(ModuleKind kind)
        {
            List<Vector3> points = new List<Vector3>();
            if (kind == ModuleKind.Left || kind == ModuleKind.Right)
            {
                float sign = kind == ModuleKind.Left ? -1f : 1f;
                const float radius = 8f;
                for (int i = 0; i <= 16; i++)
                {
                    float angle = Mathf.PI * 0.5f * i / 16f;
                    points.Add(new Vector3(sign * radius * (1f - Mathf.Cos(angle)), 0f,
                        radius * Mathf.Sin(angle)));
                }
            }
            else
            {
                for (int i = 0; i <= 18; i++) points.Add(new Vector3(0f, 0f, i));
            }
            return points;
        }

        private static void AddDeck(Transform root, List<Vector3> path, bool gap, Material material)
        {
            int first = 0;
            while (first < path.Count - 1)
            {
                int last = path.Count - 1;
                if (gap && first == 0) last = 6;
                else if (gap && first == 11) last = 18;
                else if (gap) break;

                List<Vector3> sub = path.GetRange(first, last - first + 1);
                Mesh mesh = RibbonMesh(sub, 4.7f, 0f);
                string meshPath = Root + "/" + root.name + "_Deck_" + first + ".asset";
                if (AssetDatabase.LoadAssetAtPath<Mesh>(meshPath) != null) AssetDatabase.DeleteAsset(meshPath);
                AssetDatabase.CreateAsset(mesh, meshPath);
                GameObject deck = new GameObject("Walkable_Deck_" + first);
                deck.transform.SetParent(root, false);
                MeshFilter filter = deck.AddComponent<MeshFilter>();
                filter.sharedMesh = mesh;
                MeshRenderer renderer = deck.AddComponent<MeshRenderer>();
                renderer.sharedMaterial = material;
                MeshCollider collider = deck.AddComponent<MeshCollider>();
                collider.sharedMesh = mesh;

                if (!gap) break;
                first = 11;
                if (last == 18) break;
            }
        }

        private static Mesh RibbonMesh(List<Vector3> path, float width, float y)
        {
            Vector3[] vertices = new Vector3[path.Count * 2];
            int[] triangles = new int[(path.Count - 1) * 6];
            for (int i = 0; i < path.Count; i++)
            {
                Vector3 tangent = (i == path.Count - 1 ? path[i] - path[i - 1] : path[i + 1] - path[i]).normalized;
                Vector3 right = Vector3.Cross(Vector3.up, tangent).normalized;
                vertices[i * 2] = path[i] - right * width * 0.5f + Vector3.up * y;
                vertices[i * 2 + 1] = path[i] + right * width * 0.5f + Vector3.up * y;
                if (i == 0) continue;
                int t = (i - 1) * 6, a = (i - 1) * 2, b = i * 2;
                triangles[t] = a; triangles[t + 1] = b; triangles[t + 2] = a + 1;
                triangles[t + 3] = a + 1; triangles[t + 4] = b; triangles[t + 5] = b + 1;
            }
            Mesh mesh = new Mesh { name = "TrackRibbon" };
            mesh.vertices = vertices;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        private static void AddRails(Transform root, List<Vector3> path, Material trim, Material moss)
        {
            for (int i = 0; i < path.Count; i += 2)
            {
                Vector3 tangent = (i == path.Count - 1 ? path[i] - path[i - 1] : path[Mathf.Min(i + 1, path.Count - 1)] - path[i]).normalized;
                Quaternion rotation = Quaternion.LookRotation(tangent, Vector3.up);
                Vector3 right = Vector3.Cross(Vector3.up, tangent).normalized;
                for (int side = -1; side <= 1; side += 2)
                {
                    Vector3 pos = path[i] + right * side * 2.55f;
                    CreateCube("Carved_Railing", root, pos + Vector3.up * 0.52f,
                        new Vector3(0.38f, 1.04f, 1.8f), rotation, trim, true);
                    CreateCube("Moss_Cap", root, pos + Vector3.up * 1.08f,
                        new Vector3(0.48f, 0.10f, 1.8f), rotation, moss, false);
                }
            }
        }

        private static Transform Anchor(Transform parent, string name, Vector3 position, Vector3 forward)
        {
            GameObject anchor = new GameObject(name);
            anchor.transform.SetParent(parent, false);
            anchor.transform.localPosition = position;
            if (forward.sqrMagnitude > 0.001f)
                anchor.transform.localRotation = Quaternion.LookRotation(forward.normalized, Vector3.up);
            return anchor.transform;
        }

        private static GameObject BuildHero(Material outfit, Material skin)
        {
            GameObject root = new GameObject("Explorer");
            root.layer = 2;
            CharacterController controller = root.AddComponent<CharacterController>();
            controller.height = 1.8f;
            controller.radius = 0.34f;
            controller.center = new Vector3(0f, 0.9f, 0f);
            AddCapsule("Torso", root.transform, new Vector3(0f, 1.12f, 0f),
                new Vector3(0.72f, 0.82f, 0.42f), outfit);
            AddSphere("Head", root.transform, new Vector3(0f, 1.75f, 0.02f),
                new Vector3(0.38f, 0.43f, 0.36f), skin);
            AddCubeVisual("Backpack", root.transform, new Vector3(0f, 1.12f, -0.28f),
                new Vector3(0.48f, 0.62f, 0.25f), outfit);
            for (int side = -1; side <= 1; side += 2)
            {
                AddCapsule("Arm", root.transform, new Vector3(side * 0.48f, 1.15f, 0f),
                    new Vector3(0.22f, 0.68f, 0.22f), outfit);
                AddCapsule("Leg", root.transform, new Vector3(side * 0.20f, 0.48f, 0f),
                    new Vector3(0.26f, 0.78f, 0.28f), outfit);
            }
            return root;
        }

        private static GameObject BuildGuardian(Material fur)
        {
            GameObject root = new GameObject("Temple_Guardian");
            root.layer = 2;
            AddSphere("Shoulders", root.transform, new Vector3(0f, 1.35f, 0f),
                new Vector3(1.35f, 0.9f, 0.72f), fur);
            AddSphere("Head", root.transform, new Vector3(0f, 1.85f, 0.35f),
                new Vector3(0.72f, 0.72f, 0.68f), fur);
            AddCapsule("Left_Arm", root.transform, new Vector3(-0.85f, 0.82f, 0.15f),
                new Vector3(0.38f, 1.1f, 0.38f), fur);
            AddCapsule("Right_Arm", root.transform, new Vector3(0.85f, 0.82f, 0.15f),
                new Vector3(0.38f, 1.1f, 0.38f), fur);
            AddCapsule("Left_Leg", root.transform, new Vector3(-0.38f, 0.35f, -0.08f),
                new Vector3(0.38f, 0.75f, 0.42f), fur);
            AddCapsule("Right_Leg", root.transform, new Vector3(0.38f, 0.35f, -0.08f),
                new Vector3(0.38f, 0.75f, 0.42f), fur);
            return root;
        }

        private static void BuildDemoPickups(RunProgress progress, UIFlow ui, GameBootstrap game, Material gold)
        {
            for (int i = 0; i < 8; i++)
            {
                int lane = i % 3 - 1;
                CreatePickup("Coin_" + i, new Vector3(lane * 2f, 0.9f, 5.5f + i * 1.25f),
                    PickupKind.Coin, 1, progress, ui, game, gold);
            }
            CreatePickup("Gem_01", new Vector3(-2f, 0.9f, 9.5f),
                PickupKind.Gem, 1, progress, ui, game, gold);
            CreatePickup("Gem_02", new Vector3(2f, 0.9f, 15.5f),
                PickupKind.Gem, 1, progress, ui, game, gold);
        }

        private static void CreatePickup(string name, Vector3 position, PickupKind kind, int value,
            RunProgress progress, UIFlow ui, GameBootstrap game, Material gold)
        {
            GameObject pickupRoot = new GameObject(name);
            pickupRoot.transform.position = position;
            SphereCollider trigger = pickupRoot.AddComponent<SphereCollider>();
            trigger.radius = 0.42f;
            trigger.isTrigger = true;
            Rigidbody body = pickupRoot.AddComponent<Rigidbody>();
            body.isKinematic = true;
            GameObject visual = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            visual.name = "Visual";
            visual.transform.SetParent(pickupRoot.transform, false);
            visual.transform.localScale = new Vector3(0.48f, 0.07f, 0.48f);
            visual.GetComponent<Renderer>().sharedMaterial = gold;
            Collider visualCollider = visual.GetComponent<Collider>();
            if (visualCollider != null) Object.DestroyImmediate(visualCollider);
            PickupItem pickup = pickupRoot.AddComponent<PickupItem>();
            Assign(pickup, "progress", progress);
            Assign(pickup, "ui", ui);
            Assign(pickup, "game", game);
            Assign(pickup, "kind", kind);
            Assign(pickup, "value", value);
            Assign(pickup, "visualRoot", visual);
        }

        private static void BuildDemoHazard(GameBootstrap game, Material stone)
        {
            GameObject hazard = GameObject.CreatePrimitive(PrimitiveType.Cube);
            hazard.name = "Low_Stone_Arch_Hazard";
            hazard.transform.position = new Vector3(0f, 1.15f, 13f);
            hazard.transform.localScale = new Vector3(2.1f, 0.35f, 0.5f);
            hazard.GetComponent<Renderer>().sharedMaterial = stone;
            BoxCollider trigger = hazard.GetComponent<BoxCollider>();
            trigger.isTrigger = true;
            Rigidbody body = hazard.AddComponent<Rigidbody>();
            body.isKinematic = true;
            ObstacleHazard obstacle = hazard.AddComponent<ObstacleHazard>();
            Assign(obstacle, "game", game);
            Assign(obstacle, "avoidedBy", HazardAvoidance.Slide);

            GameObject jumpBlock = GameObject.CreatePrimitive(PrimitiveType.Cube);
            jumpBlock.name = "Jump_Over_Stone_Block";
            jumpBlock.transform.position = new Vector3(2f, 0.55f, 16.5f);
            jumpBlock.transform.localScale = new Vector3(1.1f, 1.1f, 0.8f);
            jumpBlock.GetComponent<Renderer>().sharedMaterial = stone;
            BoxCollider jumpTrigger = jumpBlock.GetComponent<BoxCollider>();
            jumpTrigger.isTrigger = true;
            Rigidbody jumpBody = jumpBlock.AddComponent<Rigidbody>();
            jumpBody.isKinematic = true;
            ObstacleHazard jumpHazard = jumpBlock.AddComponent<ObstacleHazard>();
            Assign(jumpHazard, "game", game);
            Assign(jumpHazard, "avoidedBy", HazardAvoidance.Jump);
        }

        private static void BuildEnvironmentDressing(Material stone, Material moss)
        {
            for (int i = 0; i < 10; i++)
            {
                float z = 4f + i * 5f;
                CreateCube("Jungle_Rock_Left", null, new Vector3(-5f, 0.4f, z),
                    new Vector3(2.1f, 1.4f, 2.3f), Quaternion.Euler(0f, i * 17f, 0f), moss, false);
                CreateCube("Jungle_Rock_Right", null, new Vector3(5.2f, 0.5f, z + 2f),
                    new Vector3(2.5f, 1.8f, 2.0f), Quaternion.Euler(0f, i * 23f, 0f), stone, false);
            }
        }

        private static Canvas CreateCanvas()
        {
            GameObject canvasObject = new GameObject("GameCanvas", typeof(RectTransform), typeof(Canvas),
                typeof(CanvasScaler), typeof(GraphicRaycaster));
            Canvas canvas = canvasObject.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            CanvasScaler scaler = canvasObject.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920);
            scaler.matchWidthOrHeight = 0.5f;
            return canvas;
        }

        private static void BuildUI(Transform parent, UIFlow ui, GameBootstrap game, RunProgress progress)
        {
            GameObject menu = Panel("MainMenuPanel", parent);
            GameObject hud = Panel("HUDPanel", parent);
            GameObject revive = Panel("RevivePanel", parent);
            GameObject over = Panel("GameOverPanel", parent);
            menu.SetActive(true); hud.SetActive(false); revive.SetActive(false); over.SetActive(false);
            hud.GetComponent<Image>().color = new Color(0f, 0f, 0f, 0f);

            Text title = Label("JUNGLE ESCAPE", menu.transform, 58, new Vector2(0.5f, 0.76f));
            title.color = new Color(0.92f, 0.78f, 0.42f);
            Button play = MakeButton("PLAY!", menu.transform, new Vector2(0.5f, 0.38f));
            Button reviveButton = MakeButton("REVIVE - 1 GEM", revive.transform, new Vector2(0.5f, 0.52f));
            Button giveUp = MakeButton("GIVE UP", revive.transform, new Vector2(0.5f, 0.36f));
            Button restart = MakeButton("RUN AGAIN", over.transform, new Vector2(0.5f, 0.4f));
            Label("RUN OVER", over.transform, 58, new Vector2(0.5f, 0.66f));
            Label("REVIVE?", revive.transform, 54, new Vector2(0.5f, 0.72f));
            Text reviveMessage = Label("Spend one collected gem to continue", revive.transform, 28, new Vector2(0.5f, 0.62f));
            Text score = Label("0", hud.transform, 42, new Vector2(0.5f, 0.93f));
            Text distance = Label("0 m", hud.transform, 26, new Vector2(0.5f, 0.88f));
            Text coins = Label("Coins 0", hud.transform, 26, new Vector2(0.18f, 0.93f));
            Text gems = Label("Gems 0", hud.transform, 26, new Vector2(0.82f, 0.93f));

            Assign(ui, "mainMenuPanel", menu);
            Assign(ui, "hudPanel", hud);
            Assign(ui, "revivePanel", revive);
            Assign(ui, "gameOverPanel", over);
            Assign(ui, "scoreText", score);
            Assign(ui, "distanceText", distance);
            Assign(ui, "coinText", coins);
            Assign(ui, "gemText", gems);
            Assign(ui, "reviveMessage", reviveMessage);
            Assign(ui, "reviveButton", reviveButton);
            Assign(ui, "playButton", play);
            Assign(ui, "giveUpButton", giveUp);
            Assign(ui, "restartButton", restart);
        }

        private static GameObject Panel(string name, Transform parent)
        {
            GameObject panel = new GameObject(name, typeof(RectTransform), typeof(Image));
            panel.transform.SetParent(parent, false);
            RectTransform rect = panel.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero; rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero; rect.offsetMax = Vector2.zero;
            Image image = panel.GetComponent<Image>();
            image.color = new Color(0.025f, 0.035f, 0.03f, 0.82f);
            return panel;
        }

        private static Text Label(string text, Transform parent, int size, Vector2 anchor)
        {
            GameObject go = new GameObject(text + "_Text", typeof(RectTransform), typeof(Text));
            go.transform.SetParent(parent, false);
            RectTransform rect = go.GetComponent<RectTransform>();
            rect.anchorMin = anchor; rect.anchorMax = anchor; rect.sizeDelta = new Vector2(900, 100);
            rect.anchoredPosition = Vector2.zero;
            Text label = go.GetComponent<Text>();
            label.text = text;
            label.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            label.fontSize = size;
            label.alignment = TextAnchor.MiddleCenter;
            label.color = Color.white;
            return label;
        }

        private static Button MakeButton(string caption, Transform parent, Vector2 anchor)
        {
            GameObject go = new GameObject(caption + "_Button", typeof(RectTransform), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);
            RectTransform rect = go.GetComponent<RectTransform>();
            rect.anchorMin = anchor; rect.anchorMax = anchor;
            rect.sizeDelta = new Vector2(440, 112);
            rect.anchoredPosition = Vector2.zero;
            Image image = go.GetComponent<Image>();
            image.color = new Color(0.28f, 0.22f, 0.12f, 0.96f);
            Button button = go.GetComponent<Button>();
            Text label = Label(caption, go.transform, 36, new Vector2(0.5f, 0.5f));
            RectTransform labelRect = label.GetComponent<RectTransform>();
            labelRect.anchorMin = Vector2.zero; labelRect.anchorMax = Vector2.one;
            labelRect.offsetMin = Vector2.zero; labelRect.offsetMax = Vector2.zero;
            return button;
        }

        private static void AddCapsule(string name, Transform parent, Vector3 position, Vector3 scale, Material material)
        {
            GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            obj.name = name; obj.transform.SetParent(parent, false);
            obj.transform.localPosition = position; obj.transform.localScale = scale;
            obj.GetComponent<Renderer>().sharedMaterial = material;
            Collider collider = obj.GetComponent<Collider>();
            if (collider != null) Object.DestroyImmediate(collider);
        }

        private static void AddSphere(string name, Transform parent, Vector3 position, Vector3 scale, Material material)
        {
            GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            obj.name = name; obj.transform.SetParent(parent, false);
            obj.transform.localPosition = position; obj.transform.localScale = scale;
            obj.GetComponent<Renderer>().sharedMaterial = material;
            Collider collider = obj.GetComponent<Collider>();
            if (collider != null) Object.DestroyImmediate(collider);
        }

        private static void AddCubeVisual(string name, Transform parent, Vector3 position, Vector3 scale, Material material)
        {
            GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Cube);
            obj.name = name; obj.transform.SetParent(parent, false);
            obj.transform.localPosition = position; obj.transform.localScale = scale;
            obj.GetComponent<Renderer>().sharedMaterial = material;
            Collider collider = obj.GetComponent<Collider>();
            if (collider != null) Object.DestroyImmediate(collider);
        }

        private static GameObject CreateCube(string name, Transform parent, Vector3 position,
            Vector3 scale, Quaternion rotation, Material material, bool collider)
        {
            GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Cube);
            obj.name = name;
            if (parent != null) obj.transform.SetParent(parent, false);
            obj.transform.position = position;
            obj.transform.rotation = rotation;
            obj.transform.localScale = scale;
            obj.GetComponent<Renderer>().sharedMaterial = material;
            if (!collider)
            {
                Collider c = obj.GetComponent<Collider>();
                if (c != null) Object.DestroyImmediate(c);
            }
            return obj;
        }

        private static void Assign(Object target, string property, Object value)
        {
            SerializedObject so = new SerializedObject(target);
            SerializedProperty p = so.FindProperty(property);
            if (p == null) { Debug.LogWarning("Missing serialized field " + property + " on " + target); return; }
            p.objectReferenceValue = value;
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void Assign(Object target, string property, int value)
        {
            SerializedObject so = new SerializedObject(target);
            SerializedProperty p = so.FindProperty(property);
            if (p == null) return;
            p.intValue = value;
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void Assign(Object target, string property, float value)
        {
            SerializedObject so = new SerializedObject(target);
            SerializedProperty p = so.FindProperty(property);
            if (p == null) return;
            p.floatValue = value;
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void Assign(Object target, string property, bool value)
        {
            SerializedObject so = new SerializedObject(target);
            SerializedProperty p = so.FindProperty(property);
            if (p == null) return;
            p.boolValue = value;
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void Assign(Object target, string property, Object[] values)
        {
            SerializedObject so = new SerializedObject(target);
            SerializedProperty p = so.FindProperty(property);
            if (p == null) return;
            p.arraySize = values.Length;
            for (int i = 0; i < values.Length; i++) p.GetArrayElementAtIndex(i).objectReferenceValue = values[i];
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void Assign(Object target, string property, HazardAvoidance value)
        {
            SerializedObject so = new SerializedObject(target);
            SerializedProperty p = so.FindProperty(property);
            if (p == null) return;
            p.enumValueIndex = (int)value;
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void Assign(Object target, string property, PickupKind value)
        {
            SerializedObject so = new SerializedObject(target);
            SerializedProperty p = so.FindProperty(property);
            if (p == null) return;
            p.enumValueIndex = (int)value;
            so.ApplyModifiedPropertiesWithoutUndo();
        }
    }
}
