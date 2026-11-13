using UnityEngine;

namespace JungleEscape
{
    public sealed class GuardianAnimationDriver : MonoBehaviour
    {
        [SerializeField] private Animator animator;
        [SerializeField] private GuardianChase chase;
        [SerializeField, Min(0f)] private float dampTime = 0.12f;

        private static readonly int MoveSpeed = Animator.StringToHash("MoveSpeed");
        private static readonly int Roar = Animator.StringToHash("Roar");
        private static readonly int Catch = Animator.StringToHash("Catch");
        private static readonly int Fall = Animator.StringToHash("Fall");

        private void Update()
        {
            if (animator == null || animator.runtimeAnimatorController == null) return;
            float speed = chase != null && chase.IsChaseActive ? 1f : 0f;
            animator.SetFloat(MoveSpeed, speed, dampTime, Time.deltaTime);
        }

        public void PlayRoar()
        {
            if (animator != null && animator.runtimeAnimatorController != null)
                animator.SetTrigger(Roar);
        }

        public void PlayCatch()
        {
            if (animator != null && animator.runtimeAnimatorController != null)
                animator.SetTrigger(Catch);
        }

        public void PlayFall()
        {
            if (animator != null && animator.runtimeAnimatorController != null)
                animator.SetTrigger(Fall);
        }

        public void ResetAnimation()
        {
            if (animator == null || animator.runtimeAnimatorController == null) return;
            animator.ResetTrigger(Roar);
            animator.ResetTrigger(Catch);
            animator.ResetTrigger(Fall);
        }
    }
}
