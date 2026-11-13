using System;
using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;

namespace JungleEscape.EditorTools
{
    /// <summary>Imports an optional FBX hero and creates a simple parameter-driven controller from its clips.</summary>
    public static class CharacterAnimatorFactory
    {
        public static Animator AttachHero(GameObject runnerRoot, string fbxPath)
        {
            GameObject modelAsset = AssetDatabase.LoadAssetAtPath<GameObject>(fbxPath);
            if (modelAsset == null) return null;

            GameObject model = PrefabUtility.InstantiatePrefab(modelAsset) as GameObject;
            if (model == null) return null;
            model.name = "Explorer_BlackSuit_Model";
            model.transform.SetParent(runnerRoot.transform, false);
            model.transform.localPosition = Vector3.zero;
            model.transform.localRotation = Quaternion.identity;
            model.transform.localScale = Vector3.one;

            Animator animator = runnerRoot.AddComponent<Animator>();
            Avatar[] avatars = AssetDatabase.LoadAllAssetsAtPath(fbxPath).OfType<Avatar>().ToArray();
            Avatar avatar = avatars.FirstOrDefault(candidate => candidate != null && candidate.isValid && candidate.isHuman)
                ?? avatars.FirstOrDefault(candidate => candidate != null && candidate.isValid)
                ?? model.GetComponentInChildren<Animator>()?.avatar;
            animator.avatar = avatar;
            animator.applyRootMotion = false;

            AnimatorController controller = CreateHeroController(fbxPath);
            if (controller != null) animator.runtimeAnimatorController = controller;
            if (avatar == null)
                Debug.LogWarning("Explorer FBX imported but no valid Avatar was found. Check the FBX Rig tab and avatar mapping.", model);

            return animator;
        }

        private static AnimatorController CreateHeroController(string fbxPath)
        {
            AnimationClip[] clips = LoadCharacterClips();

            if (clips.Length == 0)
            {
                Debug.LogWarning("No animation clips found in " + fbxPath + ". Add/retarget Idle, Run, Jump, Slide and Fall clips.");
                return null;
            }

            const string controllerPath = "Assets/Characters/Explorer.controller";
            if (AssetDatabase.LoadAssetAtPath<AnimatorController>(controllerPath) != null)
                AssetDatabase.DeleteAsset(controllerPath);

            AnimatorController controller = AnimatorController.CreateAnimatorControllerAtPath(controllerPath);
            controller.AddParameter("MoveSpeed", AnimatorControllerParameterType.Float);
            controller.AddParameter("Grounded", AnimatorControllerParameterType.Bool);
            controller.AddParameter("Sliding", AnimatorControllerParameterType.Bool);
            controller.AddParameter("Stumbling", AnimatorControllerParameterType.Bool);
            controller.AddParameter("Dead", AnimatorControllerParameterType.Bool);
            controller.AddParameter("Jump", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("Fall", AnimatorControllerParameterType.Trigger);

            AnimatorStateMachine machine = controller.layers[0].stateMachine;
            AnimationClip idleClip = FindClip(clips, "idle", "stand");
            AnimationClip runClip = FindClip(clips, "run", "sprint", "jog", "walk");
            AnimationClip jumpClip = FindClip(clips, "jump", "leap");
            AnimationClip slideClip = FindClip(clips, "slide", "roll", "crouch");
            AnimationClip stumbleClip = FindClip(clips, "stumble", "hit", "fall");
            AnimationClip fallClip = FindClip(clips, "death", "fall", "die");
            if (idleClip == null && runClip == null) runClip = clips[0];

            AnimatorState idle = AddState(machine, "Idle", idleClip);
            AnimatorState run = AddState(machine, "Run", runClip);
            AnimatorState jump = AddState(machine, "Jump", jumpClip);
            AnimatorState slide = AddState(machine, "Slide", slideClip);
            AnimatorState stumble = AddState(machine, "Stumble", stumbleClip);
            AnimatorState fall = AddState(machine, "Fall", fallClip);

            AnimatorState locomotion = run != null ? run : idle;
            machine.defaultState = idle != null ? idle : locomotion != null ? locomotion :
                jump != null ? jump : slide != null ? slide : stumble != null ? stumble : fall;

            if (idle != null && run != null)
            {
                AnimatorStateTransition startRun = idle.AddTransition(run);
                startRun.hasExitTime = false;
                startRun.AddCondition(AnimatorConditionMode.Greater, 0.1f, "MoveSpeed");
                AnimatorStateTransition stopRun = run.AddTransition(idle);
                stopRun.hasExitTime = false;
                stopRun.AddCondition(AnimatorConditionMode.Less, 0.1f, "MoveSpeed");
            }

            if (jump != null)
            {
                AnimatorStateTransition jumpTrigger = machine.AddAnyStateTransition(jump);
                jumpTrigger.hasExitTime = false;
                jumpTrigger.AddCondition(AnimatorConditionMode.If, 0f, "Jump");
                if (locomotion != null)
                {
                    AnimatorStateTransition jumpEnd = jump.AddTransition(locomotion);
                    jumpEnd.hasExitTime = true;
                    jumpEnd.exitTime = 0.9f;
                }
            }

            if (slide != null)
            {
                AnimatorStateTransition slideTrigger = machine.AddAnyStateTransition(slide);
                slideTrigger.hasExitTime = false;
                slideTrigger.AddCondition(AnimatorConditionMode.If, 0f, "Sliding");
                if (locomotion != null)
                {
                    AnimatorStateTransition slideEnd = slide.AddTransition(locomotion);
                    slideEnd.hasExitTime = false;
                    slideEnd.AddCondition(AnimatorConditionMode.IfNot, 0f, "Sliding");
                }
            }

            if (stumble != null)
            {
                AnimatorStateTransition stumbleTrigger = machine.AddAnyStateTransition(stumble);
                stumbleTrigger.hasExitTime = false;
                stumbleTrigger.AddCondition(AnimatorConditionMode.If, 0f, "Stumbling");
                if (locomotion != null)
                {
                    AnimatorStateTransition stumbleEnd = stumble.AddTransition(locomotion);
                    stumbleEnd.hasExitTime = false;
                    stumbleEnd.AddCondition(AnimatorConditionMode.IfNot, 0f, "Stumbling");
                }
            }

            if (fall != null)
            {
                AnimatorStateTransition fallTrigger = machine.AddAnyStateTransition(fall);
                fallTrigger.hasExitTime = false;
                fallTrigger.AddCondition(AnimatorConditionMode.If, 0f, "Fall");
            }

            EditorUtility.SetDirty(controller);
            AssetDatabase.SaveAssets();
            return controller;
        }

        private static AnimationClip[] LoadCharacterClips()
        {
            List<AnimationClip> clips = new List<AnimationClip>();
            string[] modelGuids = AssetDatabase.FindAssets("t:Model", new[] { "Assets/Characters" });
            foreach (string guid in modelGuids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                foreach (UnityEngine.Object asset in AssetDatabase.LoadAllAssetsAtPath(path))
                {
                    if (asset is AnimationClip clip &&
                        !clip.name.StartsWith("__preview__", StringComparison.OrdinalIgnoreCase))
                        clips.Add(clip);
                }
            }
            return clips.Distinct().ToArray();
        }

        private static AnimatorState AddState(AnimatorStateMachine machine, string name, AnimationClip clip)
        {
            if (clip == null) return null;
            AnimatorState state = machine.AddState(name);
            state.motion = clip;
            return state;
        }

        private static AnimationClip FindClip(AnimationClip[] clips, params string[] keywords)
        {
            foreach (string keyword in keywords)
            {
                AnimationClip match = clips.FirstOrDefault(clip =>
                    clip.name.IndexOf(keyword, StringComparison.OrdinalIgnoreCase) >= 0);
                if (match != null) return match;
            }
            return null;
        }
    }
}
