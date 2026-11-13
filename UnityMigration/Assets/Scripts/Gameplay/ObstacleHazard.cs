using System.Collections;
using UnityEngine;

namespace JungleEscape
{
    [RequireComponent(typeof(Collider))]
    public sealed class ObstacleHazard : MonoBehaviour
    {
        [SerializeField] private GameBootstrap game;
        [SerializeField, Range(0.2f, 2f)] private float stumbleSeverity = 0.8f;
        [SerializeField, Min(0.1f)] private float recoveryDelay = 0.9f;

        private bool triggered;
        private Collider trigger;
        private Coroutine recovery;

        private void Awake() => trigger = GetComponent<Collider>();

        private void OnEnable()
        {
            triggered = false;
            if (trigger != null) trigger.enabled = true;
        }

        private void Reset()
        {
            GetComponent<Collider>().isTrigger = true;
        }

        private void OnTriggerEnter(Collider other)
        {
            if (triggered || other.GetComponentInParent<RunnerMotor>() == null) return;
            triggered = true;
            if (trigger != null) trigger.enabled = false;
            if (game != null) recovery = StartCoroutine(ApplyHit());
        }

        private IEnumerator ApplyHit()
        {
            game.NotifyStumble(stumbleSeverity);
            yield return new WaitForSeconds(recoveryDelay);
            if (game != null) game.NotifyRecovered();
            recovery = null;
        }

        private void OnDisable()
        {
            if (recovery != null) StopCoroutine(recovery);
            recovery = null;
        }
    }
}
