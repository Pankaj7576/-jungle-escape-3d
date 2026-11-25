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
        [SerializeField] private JungleEscapeAuth authentication;

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

        private async void Start()
        {
            runner?.SetRunActive(false);
            runner?.SetInputEnabled(false);
            guardian?.SetChaseActive(false);
            ui?.HideGamePanels();

            if (authentication == null)
            {
                Debug.LogError("Jungle Escape authentication manager is missing. Login is required; gameplay remains locked.");
                ui?.HideGamePanels();
                return;
            }

            await authentication.InitializeAsync();
        }

        public void OnPlayerAuthenticated()
        {
            ui?.SetBestScore(authentication != null ? authentication.BestScore : 0);
            ui?.ShowMainMenu();
        }

        public void OnPlayerLoggedOut()
        {
            runner?.SetRunActive(false);
            runner?.SetInputEnabled(false);
            guardian?.SetChaseActive(false);
            ui?.HideGamePanels();
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
            authentication?.SaveBestScoreAsync(runProgress != null ? runProgress.Score : 0);
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
            authentication?.SaveBestScoreAsync(runProgress != null ? runProgress.Score : 0);
            runner?.SetInputEnabled(false);
            runner?.SetRunActive(false);
            guardian?.SetChaseActive(false);
            ui?.ShowGameOver();
        }
    }
}
