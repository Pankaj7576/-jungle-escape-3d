using UnityEngine;

namespace JungleEscape
{
    public enum PickupKind
    {
        Coin,
        Boost
    }

    /// <summary>Attach to a trigger collider on a coin or boost pickup prefab.</summary>
    [RequireComponent(typeof(Collider))]
    public sealed class PickupItem : MonoBehaviour
    {
        [SerializeField] private PickupKind kind = PickupKind.Coin;
        [SerializeField, Min(1)] private int coinValue = 1;
        [SerializeField, Min(0.2f)] private float boostSeconds = 1.5f;
        [SerializeField] private RunProgress progress;
        [SerializeField] private GameBootstrap game;
        [SerializeField] private GameObject visualRoot;

        private bool collected;

        private void Reset()
        {
            Collider trigger = GetComponent<Collider>();
            trigger.isTrigger = true;
        }

        private void OnTriggerEnter(Collider other)
        {
            if (collected || other.GetComponentInParent<RunnerMotor>() == null) return;
            collected = true;

            if (kind == PickupKind.Coin)
                progress?.AddCoin(coinValue);
            else
                game?.NotifyBoost(boostSeconds);

            if (visualRoot != null) visualRoot.SetActive(false);
            Collider ownCollider = GetComponent<Collider>();
            if (ownCollider != null) ownCollider.enabled = false;
            Destroy(gameObject, 0.1f);
        }
    }
}
