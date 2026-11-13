using UnityEngine;

namespace JungleEscape
{
    public sealed class GameBootstrap : MonoBehaviour
    {
        [SerializeField] private RunnerMotor runner;
        [SerializeField] private GuardianChase guardian;
        [SerializeField] private RunnerCamera runnerCamera;
        [SerializeField] private RunProgress runProgress;\n        [SerializeField] private TrackDirector track;
        [SerializeField] private UIFlow ui;

        private bool gameOver;

        private void Awake()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
            Screen.orientation = ScreenOrientation.Portrait;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
            if (runnerCamera != null && runner != null) runnerCamera.SetTarget(runner.transform);
        }

        private void Start()
        {
            runner?.SetRunActive(false);
            runner?.SetInputEnabled(false);
            ui?.ShowMainMenu();
        }

        public void StartRun()
        {
            gameOver = false;
            runner?.ResetMotor();
            runner?.SetRunActive(true);
            runner?.SetInputEnabled(true);
            guardian?.ResetChase();
            runProgress?.ResetRun();
            ui?.ShowHUD();
        }

        public void NotifyStumble(float severity = 1f)
        {
            if (gameOver) return;
            runner?.SetStumble(true);
            guardian?.OnRunnerStumble(severity);
        }

        public void NotifyRecovered()
        {
            if (gameOver) return;
            runner?.SetStumble(false);
        }

        public void NotifyBoost(float duration = 1f)
        {
            if (!gameOver) guardian?.OnRunnerBoost(duration);
        }

        public void OnRunnerCaught()
        {
            if (gameOver) return;
            gameOver = true;
            runner?.SetInputEnabled(false);
            runner?.SetRunActive(false);
            ui?.ShowRevive();
        }

        public bool TryRevive()
        {
            if (!gameOver || ui == null || !ui.TrySpendReviveGem()) return false;
            gameOver = false;
            runner?.ReviveAtLastSafePosition();
            guardian?.ResetChase();
            ui.ShowHUD();
            return true;
        }

        public void EndRun()
        {
            gameOver = true;
            runner?.SetInputEnabled(false);
            runner?.SetRunActive(false);
            ui?.ShowGameOver();
        }
    }
}
