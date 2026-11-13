using UnityEngine;

namespace JungleEscape
{
    /// <summary>Tracks run distance, score and collected coins without depending on a UI package.</summary>
    public sealed class RunProgress : MonoBehaviour
    {
        [SerializeField] private Transform runner;
        [SerializeField, Min(0f)] private float scorePerMeter = 1f;

        private Vector3 lastPosition;

        public float DistanceMeters { get; private set; }
        public int Coins { get; private set; }
        public int Score => Mathf.FloorToInt(DistanceMeters * scorePerMeter) + Coins * 10;

        private void Start()
        {
            if (runner == null)
            {
                Debug.LogError("RunProgress: assign the Runner transform.", this);
                enabled = false;
                return;
            }
            lastPosition = runner.position;
        }

        private void Update()
        {
            if (runner == null) return;
            // Accumulate traveled distance so 90-degree turns do not undercount the run.
            DistanceMeters += Vector3.Distance(lastPosition, runner.position);
            lastPosition = runner.position;
        }

        public void AddCoin(int amount = 1)
        {
            if (amount > 0) Coins += amount;
        }

        public void ResetRun()
        {
            if (runner != null) lastPosition = runner.position;
            DistanceMeters = 0f;
            Coins = 0;
        }
    }
}