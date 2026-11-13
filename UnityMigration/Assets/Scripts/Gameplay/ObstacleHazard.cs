using System.Collections;
using UnityEngine;

namespace JungleEscape
{
    public enum HazardAvoidance { None, Slide, Jump }

    [RequireComponent(typeof(Collider))]
    public sealed class ObstacleHazard : MonoBehaviour
    {
        [SerializeField] private GameBootstrap game;
        [SerializeField] private HazardAvoidance avoidedBy = HazardAvoidance.None;
        [SerializeField, Range(0.2f, 2f)] private float stumbleSeverity = 0.8f;
        [SerializeField, Min(0.1f)] private float recoveryDelay = 0.9f;

        private bool triggered;
        private Collider trigger;
        private Coroutine recovery;

        public void Configure(GameBootstrap bootstrap, HazardAvoidance avoidance)
        {
            game = bootstrap;
            avoidedBy = avoidance;
            if (trigger == null) trigger = GetComponent<Collider>();
            if (trigger != null) trigger.isTrigger = true;
        }

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
            if (triggered) return;
            RunnerMotor motor = other.GetComponentInParent<RunnerMotor>();
            if (motor == null) return;
            if (avoidedBy == HazardAvoidance.Slide && motor.IsSliding) return;
            if (avoidedBy == HazardAvoidance.Jump && !motor.IsGrounded) return;

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
            if (recovery != null)
            {
                StopCoroutine(recovery);
                game?.NotifyRecovered();
            }
            recovery = null;
        }
    }
}
