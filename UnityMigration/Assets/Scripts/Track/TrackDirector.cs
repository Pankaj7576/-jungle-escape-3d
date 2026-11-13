using System.Collections.Generic;
using UnityEngine;

namespace JungleEscape
{
    public sealed class TrackDirector : MonoBehaviour
    {
        [SerializeField] private Transform runner;
        [SerializeField] private GameObject straightSegmentPrefab;
        [SerializeField, Min(5f)] private float segmentLength = 18f;
        [SerializeField, Min(2)] private int segmentsAhead = 7;
        [SerializeField, Min(1)] private int keepBehind = 2;

        private readonly Queue<GameObject> active = new Queue<GameObject>();
        private Vector3 nextSpawn;
        private Quaternion nextRotation = Quaternion.identity;
        private float nextRecycleAt;

        private void Start()
        {
            if (straightSegmentPrefab == null || runner == null)
            {
                Debug.LogError("TrackDirector: assign Runner and a segment prefab.", this);
                enabled = false;
                return;
            }

            nextSpawn = transform.position;
            for (int i = 0; i < segmentsAhead; i++) SpawnSegment();
            nextRecycleAt = segmentLength * (segmentsAhead - keepBehind);
        }

        private void Update()
        {
            if (runner == null || active.Count == 0) return;
            while (Vector3.Dot(runner.position - transform.position, transform.forward) >
                   nextRecycleAt)
            {
                GameObject oldest = active.Dequeue();
                oldest.SetActive(false);
                oldest.transform.SetPositionAndRotation(nextSpawn, nextRotation);
                oldest.SetActive(true);
                active.Enqueue(oldest);
                nextSpawn += nextRotation * Vector3.forward * segmentLength;
                nextRecycleAt += segmentLength;
            }
        }

        private void SpawnSegment()
        {
            GameObject segment = Instantiate(straightSegmentPrefab, nextSpawn, nextRotation, transform);
            active.Enqueue(segment);
            nextSpawn += nextRotation * Vector3.forward * segmentLength;
        }
    }
}
