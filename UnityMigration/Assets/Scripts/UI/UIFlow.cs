using UnityEngine;
using UnityEngine.UI;

namespace JungleEscape
{
    /// <summary>
    /// Lightweight uGUI flow. Gems are local PlayerPrefs prototype currency, not a payment wallet.
    /// </summary>
    public sealed class UIFlow : MonoBehaviour
    {
        private const string GemsKey = "JungleEscape.Gems";

        [Header("Panels")]
        [SerializeField] private GameObject mainMenuPanel;
        [SerializeField] private GameObject hudPanel;
        [SerializeField] private GameObject revivePanel;
        [SerializeField] private GameObject gameOverPanel;

        [Header("HUD")]
        [SerializeField] private Text scoreText;
        [SerializeField] private Text distanceText;
        [SerializeField] private Text coinText;
        [SerializeField] private Text gemText;

        [Header("Buttons and references")]
        [SerializeField] private Text reviveMessage;
        [SerializeField] private Button reviveButton;
        [SerializeField] private Button playButton;
        [SerializeField] private Button giveUpButton;
        [SerializeField] private Button restartButton;
        [SerializeField] private GameBootstrap game;
        [SerializeField] private RunProgress progress;

        private void Awake()
        {
            if (playButton != null) playButton.onClick.AddListener(() => game?.StartRun());
            if (reviveButton != null) reviveButton.onClick.AddListener(() => game?.TryRevive());
            if (giveUpButton != null) giveUpButton.onClick.AddListener(() => game?.EndRun());
            if (restartButton != null) restartButton.onClick.AddListener(() => game?.StartRun());
        }

        private void Update()
        {
            if (hudPanel == null || !hudPanel.activeSelf || progress == null) return;
            if (scoreText != null) scoreText.text = progress.Score.ToString("N0");
            if (distanceText != null) distanceText.text = Mathf.FloorToInt(progress.DistanceMeters) + " m";
            if (coinText != null) coinText.text = progress.Coins.ToString();
            if (gemText != null) gemText.text = GetGems().ToString();
        }

        public void ShowMainMenu() => SetPanels(true, false, false, false);
        public void ShowHUD() => SetPanels(false, true, false, false);

        public void ShowRevive()
        {
            SetPanels(false, true, true, false);
            int gems = GetGems();
            if (reviveMessage != null)
                reviveMessage.text = gems > 0
                    ? "REVIVE USING 1 GEM?\nYou have " + gems + " gems."
                    : "NO GEMS LEFT\nRun over!";
            if (reviveButton != null) reviveButton.interactable = gems > 0;
        }

        public void ShowGameOver() => SetPanels(false, false, false, true);

        private void SetPanels(bool menu, bool hud, bool revive, bool over)
        {
            if (mainMenuPanel != null) mainMenuPanel.SetActive(menu);
            if (hudPanel != null) hudPanel.SetActive(hud);
            if (revivePanel != null) revivePanel.SetActive(revive);
            if (gameOverPanel != null) gameOverPanel.SetActive(over);
        }

        public bool TrySpendReviveGem()
        {
            int gems = GetGems();
            if (gems < 1) { ShowGameOver(); return false; }
            PlayerPrefs.SetInt(GemsKey, gems - 1);
            PlayerPrefs.Save();
            return true;
        }

        public void AddGems(int amount)
        {
            if (amount <= 0) return;
            PlayerPrefs.SetInt(GemsKey, GetGems() + amount);
            PlayerPrefs.Save();
        }

        public int GetGems() => PlayerPrefs.GetInt(GemsKey, 0);
    }
}
