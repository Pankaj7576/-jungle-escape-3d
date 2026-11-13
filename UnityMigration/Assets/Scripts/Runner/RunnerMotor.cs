using UnityEngine;
using UnityEngine.Events;

namespace JungleEscape
{
    [RequireComponent(typeof(CharacterController))]
    public sealed class RunnerMotor : MonoBehaviour
    {
        [Header("Track frame")]
        [SerializeField] private TrackDirector track;
        [SerializeField, Min(0.5f)] private float laneWidth = 2.15f;
        [SerializeField, Min(1f)] private float laneChangeSpeed = 12f;
        [SerializeField, Min(2)] private int laneCount = 3;

        [Header("Movement")]
        [SerializeField, Min(0f)] private float forwardSpeed = 10f;
        [SerializeField, Min(0f)] private float stumbleSpeedMultiplier = 0.72f;
        [SerializeField, Min(1f)] private float jumpVelocity = 7.2f;
        [SerializeField] private float gravity = -22f;
        [SerializeField, Min(0.1f)] private float slideDuration = 0.78f;
        [SerializeField, Min(0.5f)] private float slideHeight = 1.0f;
        [SerializeField] private float fallDeathY = -12f;
        [SerializeField] private UnityEvent onFall;

        private CharacterController controller;
        private int lane = 1;
        private float verticalSpeed;
        private float slideRemaining;
        private float standingHeight;
        private Vector3 standingCenter;
        private bool inputEnabled = true;
        private bool hasFallen;

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

        public void SetInputEnabled(bool value) => inputEnabled = value;

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
            if (hasFallen) return;

            if (controller.isGrounded && verticalSpeed < 0f) verticalSpeed = -2f;
            verticalSpeed += gravity * Time.deltaTime;
            slideRemaining = Mathf.Max(0f, slideRemaining - Time.deltaTime);
            if (!IsSliding)
            {
                controller.height = standingHeight;
                controller.center = standingCenter;
            }

            Vector3 forward;
            Vector3 right;
            Vector3 center;
            if (track != null) track.GetTrackFrame(transform.position, out center, out forward, out right);
            else { forward = transform.forward; right = transform.right; center = transform.position; }

            float targetLaneOffset = (lane - (laneCount - 1) * 0.5f) * laneWidth;
            float currentOffset = Vector3.Dot(transform.position - center, right);
            float lateralSpeed = Mathf.Clamp((targetLaneOffset - currentOffset) * laneChangeSpeed,
                -laneChangeSpeed, laneChangeSpeed);

            float speed = forwardSpeed * (IsStumbling ? stumbleSpeedMultiplier : 1f);
            Vector3 velocity = forward * speed + right * lateralSpeed;
            velocity.y = verticalSpeed;
            controller.Move(velocity * Time.deltaTime);

            if (forward.sqrMagnitude > 0.001f)
                transform.rotation = Quaternion.Slerp(transform.rotation,
                    Quaternion.LookRotation(forward, Vector3.up),
                    1f - Mathf.Exp(12f * Time.deltaTime));

            if (transform.position.y < fallDeathY)
            {
                hasFallen = true;
                inputEnabled = false;
                onFall?.Invoke();
            }
        }

        public void ResetMotor()
        {
            hasFallen = false;
            inputEnabled = true;
            lane = 1;
            verticalSpeed = 0f;
            slideRemaining = 0f;
            IsStumbling = false;
            controller.height = standingHeight;
            controller.center = standingCenter;
        }
    }
}
