using UnityEngine;
using UnityEngine.Events;

namespace JungleEscape
{
    public sealed class GuardianChase : MonoBehaviour
    {
        [SerializeField] private Transform runner;
        [SerializeField, Min(0.5f)] private float desiredGap = 5.5f;
        [SerializeField, Min(0.1f)] private float closeRate = 5f;
        [SerializeField, Min(0.1f)] private float recoverRate = 1.8f;
        [SerializeField, Min(0.5f)] private float catchDistance = 1.45f;
        [SerializeField] private UnityEvent onCaught = new UnityEvent();

        private float gap;
        private bool caught;
        private bool chaseActive;

        private void Awake() => gap = desiredGap;

        public void SetCaughtHandler(UnityAction handler)
        {
            onCaught ??= new UnityEvent();
            onCaught.RemoveAllListeners();
            if (handler != null) onCaught.AddListener(handler);
        }

        public void SetChaseActive(bool value)
        {
            chaseActive = value;
            if (!value) return;
            caught = false;
        }

        public void OnRunnerStumble(float severity = 1f)
        {
            if (!chaseActive || caught) return;
            gap = Mathf.Max(0.8f, gap - Mathf.Clamp(severity, 0.2f, 2f) * 1.8f);
        }

        public void OnRunnerBoost(float seconds = 1f)
        {
            if (!chaseActive || caught) return;
            gap = Mathf.Min(10f, gap + Mathf.Clamp(seconds, 0.2f, 3f));
        }

        private void LateUpdate()
        {
            if (!chaseActive || runner == null || caught) return;
            Vector3 target = runner.position - runner.forward * gap;
            transform.position = Vector3.Lerp(transform.position, target,
                1f - Mathf.Exp(-closeRate * Time.deltaTime));
            Vector3 direction = runner.position - transform.position;
            direction.y = 0f;
            if (direction.sqrMagnitude > 0.001f)
                transform.rotation = Quaternion.Slerp(transform.rotation,
                    Quaternion.LookRotation(direction), 1f - Mathf.Exp(-8f * Time.deltaTime));

            gap = Mathf.MoveTowards(gap, desiredGap, recoverRate * Time.deltaTime);
            if (Vector3.Distance(transform.position, runner.position) <= catchDistance)
            {
                caught = true;
                chaseActive = false;
                onCaught?.Invoke();
            }
        }

        public void ResetChase()
        {
            caught = false;
            gap = desiredGap;
            if (runner != null)
                transform.position = runner.position - runner.forward * desiredGap;
            chaseActive = true;
        }
    }
}
