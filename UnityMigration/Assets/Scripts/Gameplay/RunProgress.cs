using UnityEngine;

namespace JungleEscape
{
    /// <summary>Tracks run distance, score and collected coins without depending on a UI package.</summary>
    public sealed class RunProgress : MonoBehaviour
    {
        [SerializeField] private Transform runner;
        [SerializeField, Min(0f)] private float scorePerMeter = 1f;

        private Vector3 startPosition;
        private float bestDistance;
        private int coins;

        public float DistanceMeters { get; private set; }
        public int Coins => coins;
        public int Score => Mathf.FloorToInt(DistanceMeters * scorePerMeter) + coins * 10;

        private void Start()
        {
            if (runner == null)
            {
                Debug.LogError("RunProgress: assign the Runner transform.", this);
                enabled = false;
                return;
            }
            startPosition = runner.position;
        }

        private void Update()
        {
            if (runner == null) return;
            // Distance is measured from the start along the runner's actual displacement.
            // This remains useful for straight and rotated track sections.
            DistanceMeters = Mathf.Max(bestDistance, Vector3.Distance(startPosition, runner.position));
            bestDistance = DistanceMeters;
        }

        public void AddCoin(int amount = 1)
        {
            if (amount > 0) coins += amount;
        }

        public void ResetRun()
        {
            if (runner != null) startPosition = runner.position;
            DistanceMeters = 0f;
            bestDistance = 0f;
            coins = 0;
        }
    }
}
