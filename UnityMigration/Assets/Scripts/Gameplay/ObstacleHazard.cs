using System.Collections;
using UnityEngine;

namespace JungleEscape
{
    /// <summary>Trigger-based obstacle response. Place on the obstacle root.</summary>
    [RequireComponent(typeof(Collider))]
    public sealed class ObstacleHazard : MonoBehaviour
    {
        [SerializeField] private GameBootstrap game;
        [SerializeField, Range(0.2f, 2f)] private float stumbleSeverity = 0.8f;
        [SerializeField, Min(0.1f)] private float recoveryDelay = 0.9f;

        private bool triggered;

        private void Reset()
        {
            Collider trigger = GetComponent<Collider>();
            trigger.isTrigger = true;
        }

        private void OnTriggerEnter(Collider other)
        {
            if (triggered || other.GetComponentInParent<RunnerMotor>() == null) return;
            triggered = true;

            Collider ownCollider = GetComponent<Collider>();
            if (ownCollider != null) ownCollider.enabled = false;
            if (game != null) StartCoroutine(ApplyHit());
        }

        private IEnumerator ApplyHit()
        {
            game.NotifyStumble(stumbleSeverity);
            yield return new WaitForSeconds(recoveryDelay);
            if (game != null) game.NotifyRecovered();
        }
    }
}