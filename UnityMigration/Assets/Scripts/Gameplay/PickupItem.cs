using UnityEngine;

namespace JungleEscape
{
    public enum PickupKind { Coin, Gem, Boost }

    [RequireComponent(typeof(Collider), typeof(Rigidbody))]
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
        private Collider trigger;

        private void Awake()
        {
            trigger = GetComponent<Collider>();
            Rigidbody body = GetComponent<Rigidbody>();
            body.isKinematic = true;
            body.useGravity = false;
        }

        private void OnEnable()
        {
            collected = false;
            if (trigger != null) trigger.enabled = true;
            if (visualRoot != null) visualRoot.SetActive(true);
        }

        private void Reset()
        {
            GetComponent<Collider>().isTrigger = true;
            Rigidbody body = GetComponent<Rigidbody>();
            body.isKinematic = true;
            body.useGravity = false;
        }

        private void OnTriggerEnter(Collider other)
        {
            if (collected || other.GetComponentInParent<RunnerMotor>() == null) return;
            collected = true;

            switch (kind)
            {
                case PickupKind.Coin: progress?.AddCoin(value); break;
                case PickupKind.Gem: ui?.AddGems(value); break;
                case PickupKind.Boost: game?.NotifyBoost(boostSeconds); break;
            }

            if (visualRoot != null) visualRoot.SetActive(false);
            if (trigger != null) trigger.enabled = false;
            // Keep this child active so OnEnable resets it when its pooled segment returns.
        }
    }
}
