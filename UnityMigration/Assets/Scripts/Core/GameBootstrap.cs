using UnityEngine;

namespace JungleEscape
{
    public sealed class GameBootstrap : MonoBehaviour
    {
        [SerializeField] private RunnerMotor runner;
        [SerializeField] private GuardianChase guardian;
        [SerializeField] private RunnerCamera runnerCamera;
        [SerializeField] private RunProgress runProgress;
        [SerializeField] private TrackDirector track;
        [SerializeField] private UIFlow ui;

        private bool gameOver;
        private bool reviveUsed;

        private void Awake()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
            Screen.orientation = ScreenOrientation.Portrait;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
            if (runnerCamera != null && runner != null)
                runnerCamera.SetTarget(runner.transform);
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
            reviveUsed = false;
            runner?.ResetMotor();
            track?.ResetTrack();
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
            if (reviveUsed) ui?.ShowGameOver();
            else ui?.ShowRevive();
        }

        public bool TryRevive()
        {
            if (!gameOver || reviveUsed || ui == null || !ui.TrySpendReviveGem())
                return false;
            reviveUsed = true;
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
