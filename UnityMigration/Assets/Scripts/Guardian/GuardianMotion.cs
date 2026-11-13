using UnityEngine;

namespace JungleEscape
{
    /// <summary>
    /// Lightweight procedural body motion for a static guardian source mesh.
    /// Replace this with the guardian's Generic run/roar/catch Animator once a rigged asset is ready.
    /// </summary>
    public sealed class GuardianMotion : MonoBehaviour
    {
        [SerializeField] private Transform visualRoot;
        [SerializeField] private GuardianChase chase;
        [SerializeField, Min(0f)] private float bobAmplitude = 0.055f;
        [SerializeField, Min(0.1f)] private float bobFrequency = 7.5f;
        [SerializeField, Min(0f)] private float pitchDegrees = 2.8f;
        [SerializeField, Min(0f)] private float rollDegrees = 1.6f;
        [SerializeField, Min(0.1f)] private float settleSpeed = 8f;

        private Vector3 basePosition;
        private Quaternion baseRotation;

        private void Awake()
        {
            if (visualRoot == null && transform.childCount > 0)
                visualRoot = transform.GetChild(0);
            if (visualRoot != null)
            {
                basePosition = visualRoot.localPosition;
                baseRotation = visualRoot.localRotation;
            }
        }

        private void LateUpdate()
        {
            if (visualRoot == null) return;
            if (chase != null && chase.IsChaseActive)
            {
                float phase = Time.time * bobFrequency;
                visualRoot.localPosition = basePosition +
                    Vector3.up * (Mathf.Abs(Mathf.Sin(phase * 2f)) * bobAmplitude);
                visualRoot.localRotation = baseRotation * Quaternion.Euler(
                    Mathf.Sin(phase) * pitchDegrees, 0f, Mathf.Sin(phase * 0.5f) * rollDegrees);
            }
            else
            {
                float blend = 1f - Mathf.Exp(-settleSpeed * Time.deltaTime);
                visualRoot.localPosition = Vector3.Lerp(visualRoot.localPosition, basePosition, blend);
                visualRoot.localRotation = Quaternion.Slerp(visualRoot.localRotation, baseRotation, blend);
            }
        }
    }
}
