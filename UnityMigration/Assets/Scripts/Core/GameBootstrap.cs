using UnityEngine;

namespace JungleEscape
{
    public sealed class GameBootstrap : MonoBehaviour
    {
        [SerializeField] private RunnerMotor runner;
        [SerializeField] private RunnerAnimationDriver runnerAnimation;
        [SerializeField] private GuardianChase guardian;
        [SerializeField] private GuardianAnimationDriver guardianAnimation;
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
            runner?.SetFallHandler(OnRunnerCaught);
            guardian?.SetCaughtHandler(OnRunnerCaught);
            if (runnerCamera != null && runner != null)
                runnerCamera.SetTarget(runner.transform);
        }

        private void Start()
        {
            runner?.SetRunActive(false);
            runner?.SetInputEnabled(false);
            guardian?.SetChaseActive(false);
            ui?.ShowMainMenu();
        }

        public void StartRun()
        {
            gameOver = false;
            reviveUsed = false;
            runner?.ResetMotor();
            runnerAnimation?.ResetAnimation();
            track?.ResetTrack();
            guardian?.ResetChase();
            guardianAnimation?.ResetAnimation();
            guardianAnimation?.PlayRoar();
            foreach (PickupItem pickup in FindObjectsByType<PickupItem>(FindObjectsSortMode.None))
                pickup.ResetPickup();
            foreach (ObstacleHazard hazard in FindObjectsByType<ObstacleHazard>(FindObjectsSortMode.None))
                hazard.ResetHazard();
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
            runnerAnimation?.PlayFall();
            guardianAnimation?.PlayCatch();
            guardian?.SetChaseActive(false);
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
            runnerAnimation?.ResetAnimation();
            guardian?.ResetChase();
            guardianAnimation?.ResetAnimation();
            ui.ShowHUD();
            return true;
        }

        public void EndRun()
        {
            gameOver = true;
            runner?.SetInputEnabled(false);
            runner?.SetRunActive(false);
            guardian?.SetChaseActive(false);
            ui?.ShowGameOver();
        }
    }
}
