using UnityEngine;

namespace JungleEscape
{
    /// <summary>
    /// Animator parameter bridge. Add matching parameters to the Animator Controller:
    /// MoveSpeed(float), Grounded(bool), Sliding(bool), Stumbling(bool), Dead(bool),
    /// plus Jump and Fall triggers.
    /// </summary>
    public sealed class RunnerAnimationDriver : MonoBehaviour
    {
        [SerializeField] private Animator animator;
        [SerializeField] private RunnerMotor motor;
        [SerializeField, Min(0f)] private float dampTime = 0.12f;

        private static readonly int MoveSpeed = Animator.StringToHash("MoveSpeed");
        private static readonly int Grounded = Animator.StringToHash("Grounded");
        private static readonly int Sliding = Animator.StringToHash("Sliding");
        private static readonly int Stumbling = Animator.StringToHash("Stumbling");
        private static readonly int Dead = Animator.StringToHash("Dead");
        private static readonly int Jump = Animator.StringToHash("Jump");
        private static readonly int Fall = Animator.StringToHash("Fall");

        private bool wasGrounded;

        private void Update()
        {
            if (animator == null || motor == null || animator.runtimeAnimatorController == null) return;
            bool grounded = motor.IsGrounded;
            animator.SetFloat(MoveSpeed, motor.IsRunActive ? motor.ForwardSpeed : 0f, dampTime, Time.deltaTime);
            animator.SetBool(Grounded, grounded);
            animator.SetBool(Sliding, motor.IsSliding);
            animator.SetBool(Stumbling, motor.IsStumbling);
            if (!grounded && wasGrounded) animator.SetTrigger(Jump);
            wasGrounded = grounded;
        }

        public void PlayFall()
        {
            if (animator == null || animator.runtimeAnimatorController == null) return;
            animator.SetBool(Dead, true);
            animator.SetTrigger(Fall);
        }

        public void ResetAnimation()
        {
            if (animator == null || animator.runtimeAnimatorController == null) return;
            animator.SetBool(Dead, false);
            animator.ResetTrigger(Fall);
            animator.ResetTrigger(Jump);
        }
    }
}
