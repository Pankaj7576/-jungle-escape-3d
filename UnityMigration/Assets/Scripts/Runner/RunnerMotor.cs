using UnityEngine;

namespace JungleEscape
{
    [RequireComponent(typeof(CharacterController))]
    public sealed class RunnerMotor : MonoBehaviour
    {
        [Header("Lane movement")]
        [SerializeField] private float laneWidth = 2.15f;
        [SerializeField] private float laneChangeSpeed = 12f;
        [SerializeField] private int laneCount = 3;

        [Header("Motion")]
        [SerializeField] private float forwardSpeed = 10f;
        [SerializeField] private float jumpVelocity = 7.2f;
        [SerializeField] private float gravity = -22f;
        [SerializeField] private float slideDuration = 0.78f;
        [SerializeField] private float slideHeight = 1.0f;

        private CharacterController controller;
        private int lane = 1;
        private float verticalSpeed;
        private float slideRemaining;
        private float standingHeight;
        private Vector3 standingCenter;
        private bool inputEnabled = true;

        public int Lane => lane;
        public float ForwardSpeed => forwardSpeed;
        public bool IsSliding => slideRemaining > 0f;
        public bool IsGrounded => controller != null && controller.isGrounded;
        public bool IsStumbling { get; private set; }

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            standingHeight = controller.height;
            standingCenter = controller.center;
        }

        public void SetInputEnabled(bool enabled) => inputEnabled = enabled;

        public void MoveLane(int direction)
        {
            if (!inputEnabled || direction == 0) return;
            lane = Mathf.Clamp(lane + (direction > 0 ? 1 : -1), 0, laneCount - 1);
        }

        public void Jump()
        {
            if (!inputEnabled || !controller.isGrounded || IsSliding) return;
            verticalSpeed = jumpVelocity;
        }

        public void Slide()
        {
            if (!inputEnabled || !controller.isGrounded) return;
            slideRemaining = slideDuration;
            controller.height = slideHeight;
            controller.center = new Vector3(standingCenter.x, slideHeight * 0.5f, standingCenter.z);
        }

        public void SetStumble(bool value) => IsStumbling = value;

        private void Update()
        {
            if (controller.isGrounded && verticalSpeed < 0f) verticalSpeed = -2f;
            verticalSpeed += gravity * Time.deltaTime;
            slideRemaining = Mathf.Max(0f, slideRemaining - Time.deltaTime);

            if (!IsSliding)
            {
                controller.height = standingHeight;
                controller.center = standingCenter;
            }

            float targetX = (lane - (laneCount - 1) * 0.5f) * laneWidth;
            float lateral = Mathf.Clamp((targetX - transform.localPosition.x) * laneChangeSpeed,
                -laneChangeSpeed, laneChangeSpeed);

            Vector3 velocity = transform.forward * forwardSpeed + transform.right * lateral;
            velocity.y = verticalSpeed;
            controller.Move(velocity * Time.deltaTime);
        }
    }
}
