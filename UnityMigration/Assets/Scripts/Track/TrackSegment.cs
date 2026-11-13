using UnityEngine;

namespace JungleEscape
{
    /// <summary>
    /// Put Entry and Exit child transforms at the exact connection points of a modular track prefab.
    /// Their local +Z axes must point along the playable path.
    /// </summary>
    public sealed class TrackSegment : MonoBehaviour
    {
        [SerializeField] private Transform entry;
        [SerializeField] private Transform exit;
        [SerializeField] private bool isGapSegment;

        public Transform Entry => entry;
        public Transform Exit => exit;
        public bool IsGapSegment => isGapSegment;
        public Vector3 Forward => exit != null && entry != null
            ? (exit.position - entry.position).normalized
            : transform.forward;
        public Vector3 Right => Vector3.Cross(Vector3.up, Forward).normalized;

        private void OnDrawGizmosSelected()
        {
            if (entry != null && exit != null)
            {
                Gizmos.color = Color.green;
                Gizmos.DrawSphere(entry.position, 0.18f);
                Gizmos.color = Color.cyan;
                Gizmos.DrawSphere(exit.position, 0.18f);
                Gizmos.DrawLine(entry.position, exit.position);
            }
        }

        public Vector3 GetLanePosition(Vector3 worldPosition, float laneOffset)
        {
            Vector3 direction = Forward;
            Vector3 origin = entry != null ? entry.position : transform.position;
            float along = Vector3.Dot(worldPosition - origin, direction);
            return origin + direction * along + Right * laneOffset;
        }

        public float DistancePastExit(Vector3 position)
        {
            if (exit == null) return 0f;
            return Vector3.Dot(position - exit.position, exit.forward);
        }

        public bool ContainsProjection(Vector3 position, float margin = 2f)
        {
            if (entry == null || exit == null) return false;
            Vector3 axis = (exit.position - entry.position).normalized;
            float length = Vector3.Distance(entry.position, exit.position);
            float along = Vector3.Dot(position - entry.position, axis);
            Vector3 closest = entry.position + axis * Mathf.Clamp(along, 0f, length);
            return along >= -margin && along <= length + margin &&
                   (position - closest).sqrMagnitude < 100f;
        }
    }
}
