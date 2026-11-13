using UnityEngine;

namespace JungleEscape
{
    public sealed class SwipeInput : MonoBehaviour
    {
        [SerializeField] private RunnerMotor runner;
        [SerializeField, Min(10f)] private float swipePixels = 55f;
        private Vector2 touchStart;
        private bool tracking;

        private void Update()
        {
            if (runner == null) return;
#if UNITY_EDITOR || UNITY_STANDALONE
            if (Input.GetKeyDown(KeyCode.LeftArrow) || Input.GetKeyDown(KeyCode.A)) runner.MoveLane(-1);
            if (Input.GetKeyDown(KeyCode.RightArrow) || Input.GetKeyDown(KeyCode.D)) runner.MoveLane(1);
            if (Input.GetKeyDown(KeyCode.UpArrow) || Input.GetKeyDown(KeyCode.Space)) runner.Jump();
            if (Input.GetKeyDown(KeyCode.DownArrow) || Input.GetKeyDown(KeyCode.S)) runner.Slide();
#endif
            if (Input.touchCount == 0)
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

            if (!tracking || touch.phase != TouchPhase.Ended) return;
            tracking = false;
            Vector2 delta = touch.position - touchStart;
            if (delta.magnitude < swipePixels) return;

            if (Mathf.Abs(delta.x) > Mathf.Abs(delta.y))
                runner.MoveLane(delta.x > 0f ? 1 : -1);
            else if (delta.y > 0f)
                runner.Jump();
            else
                runner.Slide();
        }
    }
}
