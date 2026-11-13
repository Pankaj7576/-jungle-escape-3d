using UnityEngine;

namespace JungleEscape
{
    /// <summary>Places lightweight reusable pickups and lane hazards once on each pooled segment.</summary>
    public sealed class TrackContentSpawner : MonoBehaviour
    {
        [SerializeField] private GameBootstrap game;
        [SerializeField] private RunProgress progress;
        [SerializeField] private UIFlow ui;
        [SerializeField, Min(1)] private int coinsPerSegment = 3;
        [SerializeField, Range(0f, 1f)] private float hazardChance = 0.72f;
        [SerializeField, Min(0.5f)] private float laneWidth = 2f;

        private readonly System.Collections.Generic.HashSet<TrackSegment> generated =
            new System.Collections.Generic.HashSet<TrackSegment>();

        public void Configure(GameBootstrap gameBootstrap, RunProgress runProgress, UIFlow uiFlow)
        {
            game = gameBootstrap;
            progress = runProgress;
            ui = uiFlow;
        }

        public void Populate(TrackSegment segment)
        {
            if (segment == null || segment.IsGapSegment || generated.Contains(segment)) return;
            generated.Add(segment);

            int count = Random.Range(coinsPerSegment, coinsPerSegment + 2);
            for (int i = 0; i < count; i++)
            {
                float t = 0.22f + (0.55f * (i + 0.5f) / count);
                int lane = Random.Range(0, 3) - 1;
                Vector3 position = SampleLane(segment, t, lane);
                CreatePickup(segment.transform, position, PickupKind.Coin, 1);
            }

            if (Random.value <= hazardChance)
            {
                float t = Random.Range(0.62f, 0.84f);
                int lane = Random.Range(0, 3) - 1;
                Vector3 position = SampleLane(segment, t, lane);
                bool slide = Random.value < 0.5f;
                CreateHazard(segment.transform, position, slide ? HazardAvoidance.Slide : HazardAvoidance.Jump);
            }
        }

        private Vector3 SampleLane(TrackSegment segment, float t, int lane)
        {
            segment.SamplePath(t, out Vector3 center, out Vector3 forward);
            Vector3 right = Vector3.Cross(Vector3.up, forward).normalized;
            return center + right * (lane * laneWidth);
        }

        private void CreatePickup(Transform parent, Vector3 position, PickupKind kind, int value)
        {
            GameObject root = new GameObject(kind + "_Pickup");
            root.transform.position = position + Vector3.up * 0.9f;
            root.transform.SetParent(parent, true);
            SphereCollider trigger = root.AddComponent<SphereCollider>();
            trigger.radius = 0.38f;
            trigger.isTrigger = true;
            Rigidbody body = root.AddComponent<Rigidbody>();
            body.isKinematic = true;
            body.useGravity = false;

            GameObject visual = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            visual.name = "Visual";
            visual.transform.SetParent(root.transform, false);
            visual.transform.localScale = new Vector3(0.42f, 0.07f, 0.42f);
            Collider visualCollider = visual.GetComponent<Collider>();
            if (visualCollider != null) Destroy(visualCollider);

            PickupItem pickup = root.AddComponent<PickupItem>();
            pickup.Configure(kind, value, progress, game, ui, visual);
        }

        private void CreateHazard(Transform parent, Vector3 position, HazardAvoidance avoidance)
        {
            GameObject root = new GameObject(avoidance + "_Hazard");
            root.transform.position = position;
            root.transform.SetParent(parent, true);
            BoxCollider trigger = root.AddComponent<BoxCollider>();
            trigger.isTrigger = true;
            Rigidbody body = root.AddComponent<Rigidbody>();
            body.isKinematic = true;
            body.useGravity = false;

            GameObject visual = GameObject.CreatePrimitive(PrimitiveType.Cube);
            visual.name = "Visual";
            visual.transform.SetParent(root.transform, false);
            Collider visualCollider = visual.GetComponent<Collider>();
            if (visualCollider != null) Destroy(visualCollider);

            if (avoidance == HazardAvoidance.Slide)
            {
                root.transform.position += Vector3.up * 1.18f;
                trigger.size = new Vector3(1.75f, 0.42f, 0.65f);
                visual.transform.localScale = trigger.size;
            }
            else
            {
                root.transform.position += Vector3.up * 0.55f;
                trigger.size = new Vector3(1.0f, 1.1f, 0.85f);
                visual.transform.localScale = trigger.size;
            }

            ObstacleHazard hazard = root.AddComponent<ObstacleHazard>();
            hazard.Configure(game, avoidance);
        }
    }
}
