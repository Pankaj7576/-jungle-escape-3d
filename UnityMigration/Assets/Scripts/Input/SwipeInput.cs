using System;
using UnityEngine;

namespace JungleEscape
{
    public sealed class SwipeInput : MonoBehaviour
    {
        public enum Direction
        {
            None,
            Left,
            Right,
            Jump,
            Slide
        }

        private const float AxisDominanceRatio = 1.2f;

        [SerializeField] private RunnerMotor runner;
        [SerializeField, Min(10f)] private float swipePixels = 55f;
        private Vector2 touchStart;
        private bool tracking;

        /// <summary>
        /// Classifies only deliberate, clearly dominant gestures.
        /// Ambiguous diagonals and short movement never change lanes or trigger actions.
        /// </summary>
        public static Direction ClassifySwipe(Vector2 delta, float minimumPixels)
        {
            float absX = Mathf.Abs(delta.x);
            float absY = Mathf.Abs(delta.y);
            float dominant = Mathf.Max(absX, absY);
            float minor = Mathf.Min(absX, absY);

            if (dominant < minimumPixels || dominant <= minor * AxisDominanceRatio)
                return Direction.None;

            if (absX >= absY)
                return delta.x < 0f ? Direction.Left : Direction.Right;

            return delta.y > 0f ? Direction.Jump : Direction.Slide;
        }

#if UNITY_EDITOR
        /// <summary>Deterministic pre-export regression checks for touch gesture classification.</summary>
        public static void ValidateGestureClassifier()
        {
            AssertDirection(new Vector2(20f, 0f), Direction.None, "short tap");
            AssertDirection(new Vector2(-80f, 0f), Direction.Left, "left swipe");
            AssertDirection(new Vector2(80f, 0f), Direction.Right, "right swipe");
            AssertDirection(new Vector2(0f, 80f), Direction.Jump, "up swipe");
            AssertDirection(new Vector2(0f, -80f), Direction.Slide, "down swipe");
            AssertDirection(new Vector2(70f, 65f), Direction.None, "ambiguous diagonal");
            Debug.Log("Jungle Escape swipe classifier checks passed (6 cases).");
        }

        private static void AssertDirection(Vector2 delta, Direction expected, string label)
        {
            Direction actual = ClassifySwipe(delta, 55f);
            if (actual != expected)
                throw new InvalidOperationException(
                    "Swipe classifier regression for " + label + ": expected " +
                    expected + ", got " + actual + ".");
        }
#endif

        private void Update()
        {
            if (runner == null) return;
#if UNITY_EDITOR || UNITY_STANDALONE
            if (Input.GetKeyDown(KeyCode.LeftArrow) || Input.GetKeyDown(KeyCode.A)) runner.MoveLane(-1);
            if (Input.GetKeyDown(KeyCode.RightArrow) || Input.GetKeyDown(KeyCode.D)) runner.MoveLane(1);
            if (Input.GetKeyDown(KeyCode.UpArrow) || Input.GetKeyDown(KeyCode.Space)) runner.Jump();
            if (Input.GetKeyDown(KeyCode.DownArrow) || Input.GetKeyDown(KeyCode.S)) runner.Slide();
#endif
            // Ignore multi-touch gestures rather than letting a second finger complete a lane change.
            if (Input.touchCount != 1)
            {
                tracking = false;
                return;
            }

            Touch touch = Input.GetTouch(0);
            if (touch.phase == TouchPhase.Began)
            {
                touchStart = touch.position;
                tracking = true;
                return;
            }

            if (touch.phase == TouchPhase.Canceled)
            {
                tracking = false;
                return;
            }

            if (!tracking || touch.phase != TouchPhase.Ended) return;
            tracking = false;

            Direction direction = ClassifySwipe(touch.position - touchStart, swipePixels);
            switch (direction)
            {
                case Direction.Left:
                    runner.MoveLane(-1);
                    break;
                case Direction.Right:
                    runner.MoveLane(1);
                    break;
                case Direction.Jump:
                    runner.Jump();
                    break;
                case Direction.Slide:
                    runner.Slide();
                    break;
            }
        }
    }
}