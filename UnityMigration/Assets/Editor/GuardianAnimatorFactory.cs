using System;
using System.Linq;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;

namespace JungleEscape.EditorTools
{
    public static class GuardianAnimatorFactory
    {
        public static Animator Attach(GameObject guardianRoot, string fbxPath)
        {
            Avatar avatar = AssetDatabase.LoadAllAssetsAtPath(fbxPath)
                .OfType<Avatar>().FirstOrDefault(candidate => candidate != null && candidate.isValid);
            AnimatorController controller = CreateController(fbxPath);
            if (avatar == null || controller == null)
            {
                Debug.LogWarning("Guardian FBX is missing a valid Generic Avatar or animation clips.");
                return null;
            }

            Animator animator = guardianRoot.AddComponent<Animator>();
            animator.avatar = avatar;
            animator.runtimeAnimatorController = controller;
            animator.applyRootMotion = false;
            return animator;
        }

        private static AnimatorController CreateController(string fbxPath)
        {
            AnimationClip[] clips = AssetDatabase.LoadAllAssetsAtPath(fbxPath)
                .OfType<AnimationClip>().Where(clip => clip != null).ToArray();
            if (clips.Length == 0) return null;

            AnimationClip idleClip = Find(clips, "Guardian_Idle");
            AnimationClip runClip = Find(clips, "Guardian_Run");
            AnimationClip roarClip = Find(clips, "Guardian_Roar");
            AnimationClip catchClip = Find(clips, "Guardian_Catch");
            AnimationClip fallClip = Find(clips, "Guardian_Fall");
            SetLoop(idleClip, true);
            SetLoop(runClip, true);

            const string controllerPath = "Assets/Characters/Guardian_Ape.controller";
            if (AssetDatabase.LoadAssetAtPath<AnimatorController>(controllerPath) != null)
                AssetDatabase.DeleteAsset(controllerPath);

            AnimatorController controller = AnimatorController.CreateAnimatorControllerAtPath(controllerPath);
            controller.AddParameter("MoveSpeed", AnimatorControllerParameterType.Float);
            controller.AddParameter("Roar", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("Catch", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("Fall", AnimatorControllerParameterType.Trigger);

            AnimatorStateMachine machine = controller.layers[0].stateMachine;
            AnimatorState idle = Add(machine, "Idle", idleClip);
            AnimatorState run = Add(machine, "Run", runClip);
            AnimatorState roar = Add(machine, "Roar", roarClip);
            AnimatorState caught = Add(machine, "Catch", catchClip);
            AnimatorState fall = Add(machine, "Fall", fallClip);
            AnimatorState locomotion = run != null ? run : idle;
            machine.defaultState = idle != null ? idle : locomotion != null ? locomotion :
                roar != null ? roar : caught != null ? caught : fall;

            if (idle != null && run != null)
            {
                AnimatorStateTransition start = idle.AddTransition(run);
                start.hasExitTime = false;
                start.AddCondition(AnimatorConditionMode.Greater, 0.1f, "MoveSpeed");
                AnimatorStateTransition stop = run.AddTransition(idle);
                stop.hasExitTime = false;
                stop.AddCondition(AnimatorConditionMode.Less, 0.1f, "MoveSpeed");
            }

            AddTrigger(machine, roar, "Roar");
            AddTrigger(machine, caught, "Catch");
            AddTrigger(machine, fall, "Fall");

            if (roar != null && locomotion != null)
            {
                AnimatorStateTransition end = roar.AddTransition(locomotion);
                end.hasExitTime = true;
                end.exitTime = 0.95f;
            }
            if (caught != null && fall != null)
            {
                AnimatorStateTransition end = caught.AddTransition(fall);
                end.hasExitTime = true;
                end.exitTime = 0.95f;
            }

            EditorUtility.SetDirty(controller);
            AssetDatabase.SaveAssets();
            return controller;
        }

        private static AnimationClip Find(AnimationClip[] clips, string name)
        {
            return clips.FirstOrDefault(clip => string.Equals(clip.name, name, StringComparison.OrdinalIgnoreCase));
        }

        private static AnimatorState Add(AnimatorStateMachine machine, string name, AnimationClip clip)
        {
            if (clip == null) return null;
            AnimatorState state = machine.AddState(name);
            state.motion = clip;
            return state;
        }

        private static void AddTrigger(AnimatorStateMachine machine, AnimatorState state, string parameter)
        {
            if (state == null) return;
            AnimatorStateTransition transition = machine.AddAnyStateTransition(state);
            transition.hasExitTime = false;
            transition.AddCondition(AnimatorConditionMode.If, 0f, parameter);
        }

        private static void SetLoop(AnimationClip clip, bool loop)
        {
            if (clip == null) return;
            AnimationClipSettings settings = AnimationUtility.GetAnimationClipSettings(clip);
            settings.loopTime = loop;
            AnimationUtility.SetAnimationClipSettings(clip, settings);
        }
    }
}
