using UnityEngine;

namespace JungleEscape
{
    public sealed class GameBootstrap : MonoBehaviour
    {
        [SerializeField] private RunnerMotor runner;
        [SerializeField] private GuardianChase guardian;
        [SerializeField] private RunnerCamera runnerCamera;
        [SerializeField] private RunProgress runProgress;

        private bool gameOver;

        private void Awake()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
            Screen.orientation = ScreenOrientation.Portrait;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
            if (runnerCamera != null && runner != null)
                runnerCamera.SetTarget(runner.transform);
        }

        public void NotifyStumble(float severity = 1f)
        {
            if (gameOver) return;
            runner?.SetStumble(true);
            guardian?.OnRunnerStumble(severity);
        }

        public void NotifyRecovered()
        {
            runner?.SetStumble(false);
        }

        public void NotifyBoost(float duration = 1f)
        {
            guardian?.OnRunnerBoost(duration);
        }

        public void OnRunnerCaught()
        {
            if (gameOver) return;
            gameOver = true;
            runner?.SetInputEnabled(false);
            Debug.Log("Game over: guardian caught the runner.");
        }

        public void RestartRun()
        {
            gameOver = false;
            if (runner != null)
            {
                runner.SetInputEnabled(true);
                runner.SetStumble(false);
            }
            guardian?.ResetChase();
            runProgress?.ResetRun();
        }
    }
}
