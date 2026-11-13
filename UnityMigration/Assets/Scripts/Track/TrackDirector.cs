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

        private readonly List<TrackSegment> active = new List<TrackSegment>();\n        private readonly Dictionary<TrackSegment, Stack<TrackSegment>> pools =\n            new Dictionary<TrackSegment, Stack<TrackSegment>>();\n        private readonly Dictionary<TrackSegment, TrackSegment> prefabOf =\n            new Dictionary<TrackSegment, TrackSegment>();
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
            TrackSegment first = GetSegment(startSegmentPrefab, transform);
            if (!Validate(first)) { enabled = false; return; }
            active.Add(first);
            nextEntry = first.Exit;
            for (int i = 1; i < segmentsAhead; i++) SpawnNext();
            UpdateCurrentSegment();
        }

        public void ResetTrack()
        {
            for (int i = 0; i < active.Count; i++)
                if (active[i] != null) Destroy(active[i].gameObject);
            active.Clear();
            CurrentSegment = null;
            TrackSegment first = CreateAligned(startSegmentPrefab, transform);
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
                ReturnSegment(old);
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
                segment.EvaluateFrame(runner.position, out Vector3 center, out Vector3 forward);
                float score = (runner.position - center).sqrMagnitude;
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

            TrackSegment instance = GetSegment(prefab, nextEntry);
            if (!Validate(instance)) { Destroy(instance.gameObject); enabled = false; return; }
            active.Add(instance);
            nextEntry = instance.Exit;
        }

        private TrackSegment GetSegment(TrackSegment prefab, Transform targetEntry)
        {
            TrackSegment instance = null;
            if (pools.TryGetValue(prefab, out Stack<TrackSegment> stack))
            {
                while (stack.Count > 0 && instance == null) instance = stack.Pop();
            }

            Quaternion rotation = targetEntry.rotation * Quaternion.Inverse(prefab.Entry.localRotation);
            Vector3 position = targetEntry.position - rotation * prefab.Entry.localPosition;
            if (instance == null)
                instance = Instantiate(prefab, position, rotation, transform);
            else
            {
                instance.transform.SetParent(transform);
                instance.transform.SetPositionAndRotation(position, rotation);
                instance.gameObject.SetActive(true);
            }

            prefabOf[instance] = prefab;
            return instance;
        }

        private void ReturnSegment(TrackSegment instance)
        {
            if (instance == null) return;
            if (!prefabOf.TryGetValue(instance, out TrackSegment prefab)) prefab = startSegmentPrefab;
            if (!pools.TryGetValue(prefab, out Stack<TrackSegment> stack))
            {
                stack = new Stack<TrackSegment>();
                pools.Add(prefab, stack);
            }
            instance.gameObject.SetActive(false);
            instance.transform.SetParent(transform);
            stack.Push(instance);
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

        public void GetTrackFrame(Vector3 position, out Vector3 center, out Vector3 forward, out Vector3 right)
        {
            if (CurrentSegment != null)
                CurrentSegment.EvaluateFrame(position, out center, out forward);
            else
            {
                center = position;
                forward = transform.forward;
            }
            right = Vector3.Cross(Vector3.up, forward).normalized;
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