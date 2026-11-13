using UnityEngine;

namespace JungleEscape
{
    public enum PickupKind
    {
        Coin,
        Gem,
        Boost
    }

    [RequireComponent(typeof(Collider))]
    public sealed class PickupItem : MonoBehaviour
    {
        [SerializeField] private PickupKind kind = PickupKind.Coin;
        [SerializeField, Min(1)] private int value = 1;
        [SerializeField, Min(0.2f)] private float boostSeconds = 1.5f;
        [SerializeField] private RunProgress progress;
        [SerializeField] private GameBootstrap game;
        [SerializeField] private UIFlow ui;
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

            switch (kind)
            {
                case PickupKind.Coin:
                    progress?.AddCoin(value);
                    break;
                case PickupKind.Gem:
                    ui?.AddGems(value);
                    break;
                case PickupKind.Boost:
                    game?.NotifyBoost(boostSeconds);
                    break;
            }

            if (visualRoot != null) visualRoot.SetActive(false);
            Collider ownCollider = GetComponent<Collider>();
            if (ownCollider != null) ownCollider.enabled = false;
            Destroy(gameObject, 0.1f);
        }
    }
}
