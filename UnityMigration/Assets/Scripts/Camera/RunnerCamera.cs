using UnityEngine;

namespace JungleEscape
{
    public sealed class RunnerCamera : MonoBehaviour
    {
        [SerializeField] private Transform target;
        [SerializeField] private Vector3 localOffset = new Vector3(0f, 4.2f, -7.5f);
        [SerializeField] private float positionSharpness = 7f;
        [SerializeField] private float rotationSharpness = 9f;
        [SerializeField] private float lookHeight = 1.25f;
        [SerializeField] private LayerMask obstructionMask = ~0;
        [SerializeField] private float collisionRadius = 0.22f;

        private void LateUpdate()
        {
            if (target == null) return;
            Vector3 desired = target.TransformPoint(localOffset);
            Vector3 focus = target.position + Vector3.up * lookHeight;
            Vector3 ray = desired - focus;
            float distance = ray.magnitude;

            if (distance > 0.01f && Physics.SphereCast(focus, collisionRadius,
                ray.normalized, out RaycastHit hit, distance, obstructionMask,
                QueryTriggerInteraction.Ignore))
                desired = hit.point + hit.normal * 0.18f;

            float posT = 1f - Mathf.Exp(-positionSharpness * Time.deltaTime);
            transform.position = Vector3.Lerp(transform.position, desired, posT);
            Quaternion look = Quaternion.LookRotation(focus - transform.position, Vector3.up);
            float rotT = 1f - Mathf.Exp(-rotationSharpness * Time.deltaTime);
            transform.rotation = Quaternion.Slerp(transform.rotation, look, rotT);
        }

        public void SetTarget(Transform value) => target = value;
    }
}
