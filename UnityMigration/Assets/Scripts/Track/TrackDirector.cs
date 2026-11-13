using System.Collections.Generic;
using UnityEngine;

namespace JungleEscape
{
    /// <summary>
    /// Builds a connected path from modular prefabs. Each prefab needs TrackSegment with
    /// Entry/Exit anchors. For turns, rotate the Exit anchor to the new path heading.
    /// A gap prefab has missing floor geometry between its two anchors.
    /// </summary>
    public sealed class TrackDirector : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private Transform runner;
        [SerializeField] private TrackSegment startSegmentPrefab;
        [SerializeField] private TrackSegment[] straightPrefabs;
        [SerializeField] private TrackSegment[] leftTurnPrefabs;
        [SerializeField] private TrackSegment[] rightTurnPrefabs;
        [SerializeField] private TrackSegment[] gapPrefabs;

        [Header("Generation")]
        [SerializeField, Min(3)] private int segmentsAhead = 8;
        [SerializeField, Min(1)] private int keepBehind = 2;
        [SerializeField, Range(0f, 1f)] private float turnChance = 0.12f;
        [SerializeField, Range(0f, 1f)] private float gapChance = 0.10f;
        [SerializeField, Min(0)] private int straightSegmentsBetweenTurns = 2;
        [SerializeField] private int randomSeed;

        private readonly List<TrackSegment> active = new List<TrackSegment>();
        private Transform nextEntry;
        private int turnCooldown;
        private System.Random random;

        public TrackSegment CurrentSegment { get; private set; }

        private void Start()
        {
            if (runner == null || startSegmentPrefab == null)
            {
                Debug.LogError("TrackDirector: assign Runner and Start Segment Prefab.", this);
                enabled = false;
                return;
            }

            random = randomSeed == 0 ? new System.Random() : new System.Random(randomSeed);
            TrackSegment first = Instantiate(startSegmentPrefab, transform.position,
                transform.rotation, transform);
            if (!Validate(first)) { enabled = false; return; }
            active.Add(first);
            nextEntry = first.Exit;
            for (int i = 1; i < segmentsAhead; i++) SpawnNext();
            UpdateCurrentSegment();
        }

        private void Update()
        {
            if (runner == null || active.Count == 0) return;
            UpdateCurrentSegment();

            while (active.Count > keepBehind + 1 &&
                   active[0] != null && active[0].DistancePastExit(runner.position) > 0f)
            {
                TrackSegment old = active[0];
                active.RemoveAt(0);
                if (old == CurrentSegment) CurrentSegment = null;
                Destroy(old.gameObject);
            }

            while (enabled && active.Count < segmentsAhead) SpawnNext();
        }

        private void UpdateCurrentSegment()
        {
            TrackSegment best = null;
            float bestScore = float.PositiveInfinity;
            for (int i = 0; i < active.Count; i++)
            {
                TrackSegment segment = active[i];
                if (segment == null) continue;
                Vector3 origin = segment.Entry.position;
                Vector3 axis = segment.Forward;
                float length = Vector3.Distance(segment.Entry.position, segment.Exit.position);
                float along = Vector3.Dot(runner.position - origin, axis);
                float clamped = Mathf.Clamp(along, 0f, length);
                Vector3 projected = origin + axis * clamped;
                float outside = along - clamped;
                float score = outside * outside + (runner.position - projected).sqrMagnitude * 0.05f;
                if (score < bestScore) { bestScore = score; best = segment; }
            }
            if (best != null) CurrentSegment = best;
        }

        private void SpawnNext()
        {
            TrackSegment prefab = ChoosePrefab();
            if (prefab == null) prefab = Pick(straightPrefabs);
            if (prefab == null)
            {
                Debug.LogError("TrackDirector: assign at least one valid straight segment prefab.", this);
                enabled = false;
                return;
            }

            Quaternion rotation = nextEntry.rotation * Quaternion.Inverse(prefab.Entry.localRotation);
            Vector3 position = nextEntry.position - rotation * prefab.Entry.localPosition;
            TrackSegment instance = Instantiate(prefab, position, rotation, transform);
            if (!Validate(instance)) { Destroy(instance.gameObject); enabled = false; return; }
            active.Add(instance);
            nextEntry = instance.Exit;
        }

        private TrackSegment ChoosePrefab()
        {
            double roll = random.NextDouble();
            if (turnCooldown == 0 && roll < turnChance)
            {
                TrackSegment turn = Pick(random.Next(2) == 0 ? leftTurnPrefabs : rightTurnPrefabs);
                if (turn != null) { turnCooldown = straightSegmentsBetweenTurns; return turn; }
            }

            if (roll < turnChance + gapChance)
            {
                TrackSegment gap = Pick(gapPrefabs);
                if (gap != null) { turnCooldown = Mathf.Max(turnCooldown, 1); return gap; }
            }

            if (turnCooldown > 0) turnCooldown--;
            return Pick(straightPrefabs);
        }

        private TrackSegment Pick(TrackSegment[] options)
        {
            if (options == null || options.Length == 0 || random == null) return null;
            List<TrackSegment> valid = new List<TrackSegment>();
            foreach (TrackSegment item in options)
                if (item != null && item.Entry != null && item.Exit != null) valid.Add(item);
            return valid.Count == 0 ? null : valid[random.Next(valid.Count)];
        }

        private bool Validate(TrackSegment segment)
        {
            if (segment == null || segment.Entry == null || segment.Exit == null)
            {
                Debug.LogError("Every track prefab needs TrackSegment with Entry and Exit assigned.", this);
                return false;
            }
            if (Vector3.Distance(segment.Entry.position, segment.Exit.position) < 1f)
            {
                Debug.LogError("TrackSegment Entry and Exit must be at least 1 metre apart.", segment);
                return false;
            }
            return true;
        }

        public Vector3 GetForward() => CurrentSegment != null ? CurrentSegment.Forward : transform.forward;

        public Vector3 GetLanePosition(Vector3 position, float laneOffset)
        {
            return CurrentSegment != null
                ? CurrentSegment.GetLanePosition(position, laneOffset)
                : position + transform.right * laneOffset;
        }
    }
}