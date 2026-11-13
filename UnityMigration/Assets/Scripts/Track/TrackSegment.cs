using UnityEngine;

namespace JungleEscape
{
    /// <summary>
    /// Entry/Exit define module connections. Add ordered Path Nodes along curved/turn
    /// centerlines (entry-to-exit) so the runner and camera follow the bend smoothly.
    /// </summary>
    public sealed class TrackSegment : MonoBehaviour
    {
        [SerializeField] private Transform entry;
        [SerializeField] private Transform exit;
        [SerializeField] private Transform[] pathNodes;
        [SerializeField] private bool isGapSegment;

        public Transform Entry => entry;
        public Transform Exit => exit;
        public bool IsGapSegment => isGapSegment;
        public Vector3 Forward => exit != null ? exit.forward : transform.forward;

        private int PathCount => pathNodes != null && pathNodes.Length > 0 ? pathNodes.Length + 2 : 2;

        private Vector3 GetPathPoint(int index)
        {
            if (index == 0) return entry.position;
            if (index == PathCount - 1) return exit.position;
            return pathNodes[index - 1].position;
        }

        public void EvaluateFrame(Vector3 worldPosition, out Vector3 center, out Vector3 forward)
        {
            center = entry != null ? entry.position : transform.position;
            forward = Forward;
            if (entry == null || exit == null) return;

            float bestSqr = float.PositiveInfinity;
            for (int i = 0; i < PathCount - 1; i++)
            {
                Vector3 a = GetPathPoint(i);
                Vector3 b = GetPathPoint(i + 1);
                Vector3 segment = b - a;
                float lengthSqr = segment.sqrMagnitude;
                if (lengthSqr < 0.0001f) continue;
                float t = Mathf.Clamp01(Vector3.Dot(worldPosition - a, segment) / lengthSqr);
                Vector3 candidate = a + segment * t;
                float sqr = (worldPosition - candidate).sqrMagnitude;
                if (sqr < bestSqr)
                {
                    bestSqr = sqr;
                    center = candidate;
                    forward = segment.normalized;
                }
            }
            forward.y = 0f;
            if (forward.sqrMagnitude < 0.001f) forward = exit.forward;
            forward.Normalize();
        }

        public Vector3 GetLanePosition(Vector3 worldPosition, float laneOffset)
        {
            EvaluateFrame(worldPosition, out Vector3 center, out Vector3 forward);
            return center + Vector3.Cross(Vector3.up, forward).normalized * laneOffset;
        }

        public float DistancePastExit(Vector3 position)
        {
            return exit == null ? 0f : Vector3.Dot(position - exit.position, exit.forward);
        }

        private void OnDrawGizmosSelected()
        {
            if (entry == null || exit == null) return;
            Gizmos.color = Color.green;
            Gizmos.DrawSphere(entry.position, 0.18f);
            Gizmos.color = Color.cyan;
            Gizmos.DrawSphere(exit.position, 0.18f);
            Gizmos.color = Color.yellow;
            for (int i = 0; i < PathCount - 1; i++)
                Gizmos.DrawLine(GetPathPoint(i), GetPathPoint(i + 1));
        }
    }
}
