using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Unity.Services.Authentication;
using Unity.Services.Authentication.PlayerAccounts;
using Unity.Services.CloudSave;
using Unity.Services.Core;
using UnityEngine;
using UnityEngine.UI;

namespace JungleEscape
{
    /// <summary>
    /// Requires a real Unity Player Account before gameplay starts.
    /// The hosted Unity Player Accounts page handles email/password and Google sign-in.
    /// Best score is cached locally and synchronized to the player's private Cloud Save data.
    /// </summary>
    [DefaultExecutionOrder(-100)]
    public sealed class JungleEscapeAuth : MonoBehaviour
    {
        private const string LocalBestScorePrefix = "JungleEscape.BestScore.";
        private const string CloudBestScoreKey = "bestScore";

        public static JungleEscapeAuth Instance { get; private set; }

        [SerializeField] private Canvas canvas;
        [SerializeField] private GameBootstrap game;

        private GameObject loginPanel;
        private GameObject logoutButtonObject;
        private Text statusText;
        private Button signInButton;
        private Button signUpButton;
        private bool servicesReady;
        private bool busy;

        public int BestScore { get; private set; }
        public bool IsSignedIn => servicesReady && AuthenticationService.Instance.IsSignedIn &&
                                  !AuthenticationService.Instance.IsAnonymous;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            BestScore = 0;
        }

        private void OnDestroy()
        {
            if (servicesReady)
            {
                try
                {
                    PlayerAccountService.Instance.SignedIn -= OnUnityPlayerAccountSignedIn;
                    PlayerAccountService.Instance.SignInFailed -= OnUnityPlayerAccountSignInFailed;
                }
                catch (Exception exception)
                {
                    Debug.LogWarning("Could not detach Player Accounts events: " + exception.Message);
                }
            }

            if (Instance == this) Instance = null;
        }

        public async Task<bool> InitializeAsync()
        {
            BuildLoginInterface();
            SetStatus("Connecting to Jungle Escape account services...");

            try
            {
                if (UnityServices.State != ServicesInitializationState.Initialized)
                    await UnityServices.InitializeAsync();

                servicesReady = true;
                PlayerAccountService.Instance.SignedIn -= OnUnityPlayerAccountSignedIn;
                PlayerAccountService.Instance.SignedIn += OnUnityPlayerAccountSignedIn;
                PlayerAccountService.Instance.SignInFailed -= OnUnityPlayerAccountSignInFailed;
                PlayerAccountService.Instance.SignInFailed += OnUnityPlayerAccountSignInFailed;

                // Restore the previously authenticated UGS player when a cached session exists.
                if (AuthenticationService.Instance.SessionTokenExists)
                {
                    try
                    {
                        if (!AuthenticationService.Instance.IsSignedIn)
                            await AuthenticationService.Instance.SignInAnonymouslyAsync();

                        if (AuthenticationService.Instance.IsSignedIn &&
                            !AuthenticationService.Instance.IsAnonymous)
                        {
                            await CompleteAuthenticatedFlowAsync();
                            return true;
                        }

                        // A guest session must never bypass the required account screen.
                        if (AuthenticationService.Instance.IsSignedIn)
                            AuthenticationService.Instance.SignOut(true);
                    }
                    catch (Exception restoreException)
                    {
                        Debug.LogWarning("Cached Jungle Escape sign-in could not be restored: " +
                                         restoreException.Message);
                        if (AuthenticationService.Instance.IsSignedIn)
                            AuthenticationService.Instance.SignOut(true);
                    }
                }

                ShowLogin();
                SetStatus("Sign in with email and password, or choose Google on the secure Unity sign-in page.");
                return false;
            }
            catch (Exception exception)
            {
                servicesReady = false;
                ShowLogin();
                SetStatus("Account service setup is incomplete: " + exception.Message +
                          "\nPlease check the Unity project link and Authentication setup.");
                Debug.LogException(exception);
                return false;
            }
        }

        private void BuildLoginInterface()
        {
            if (loginPanel != null || canvas == null) return;

            loginPanel = CreatePanel("AccountLoginPanel", canvas.transform,
                new Color(0.018f, 0.035f, 0.026f, 0.98f));
            loginPanel.transform.SetAsLastSibling();

            CreateLabel("JUNGLE ESCAPE", loginPanel.transform, 62,
                new Vector2(0.5f, 0.84f), new Vector2(920f, 120f),
                new Color(0.94f, 0.78f, 0.38f));

            CreateLabel("THE LOST TEMPLE", loginPanel.transform, 30,
                new Vector2(0.5f, 0.77f), new Vector2(900f, 70f), Color.white);

            CreateLabel("SIGN IN TO SAVE YOUR GAME PROGRESS", loginPanel.transform, 27,
                new Vector2(0.5f, 0.66f), new Vector2(940f, 90f),
                new Color(0.86f, 0.88f, 0.82f));

            signInButton = CreateButton("SIGN IN WITH EMAIL / GOOGLE", loginPanel.transform,
                new Vector2(0.5f, 0.54f), new Vector2(800f, 112f),
                () => StartUnityAccountFlow(false));

            signUpButton = CreateButton("CREATE NEW ACCOUNT", loginPanel.transform,
                new Vector2(0.5f, 0.42f), new Vector2(800f, 112f),
                () => StartUnityAccountFlow(true));

            statusText = CreateLabel("Choose email/password or Google on the secure Unity page.", loginPanel.transform, 23,
                new Vector2(0.5f, 0.25f), new Vector2(940f, 190f),
                new Color(0.86f, 0.88f, 0.82f));

            CreateLabel("Secure sign-in is provided by Unity Player Accounts.",
                loginPanel.transform, 19, new Vector2(0.5f, 0.10f),
                new Vector2(940f, 70f), new Color(0.68f, 0.72f, 0.66f));

            logoutButtonObject = CreateButton("LOG OUT", canvas.transform,
                new Vector2(0.86f, 0.96f), new Vector2(230f, 76f), SignOut).gameObject;
            logoutButtonObject.SetActive(false);
        }

        private static GameObject CreatePanel(string name, Transform parent, Color color)
        {
            GameObject panel = new GameObject(name, typeof(RectTransform), typeof(Image));
            panel.transform.SetParent(parent, false);
            RectTransform rect = panel.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
            panel.GetComponent<Image>().color = color;
            return panel;
        }

        private static Text CreateLabel(string value, Transform parent, int fontSize,
            Vector2 anchor, Vector2 size, Color color)
        {
            GameObject go = new GameObject(value + "_Text", typeof(RectTransform), typeof(Text));
            go.transform.SetParent(parent, false);
            RectTransform rect = go.GetComponent<RectTransform>();
            rect.anchorMin = anchor;
            rect.anchorMax = anchor;
            rect.sizeDelta = size;
            rect.anchoredPosition = Vector2.zero;

            Text label = go.GetComponent<Text>();
            label.text = value;
            label.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            label.fontSize = fontSize;
            label.alignment = TextAnchor.MiddleCenter;
            label.color = color;
            label.horizontalOverflow = HorizontalWrapMode.Wrap;
            label.verticalOverflow = VerticalWrapMode.Overflow;
            return label;
        }

        private static Button CreateButton(string caption, Transform parent,
            Vector2 anchor, Vector2 size, UnityEngine.Events.UnityAction action)
        {
            GameObject go = new GameObject(caption + "_Button",
                typeof(RectTransform), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);

            RectTransform rect = go.GetComponent<RectTransform>();
            rect.anchorMin = anchor;
            rect.anchorMax = anchor;
            rect.sizeDelta = size;
            rect.anchoredPosition = Vector2.zero;

            Image image = go.GetComponent<Image>();
            image.color = new Color(0.30f, 0.23f, 0.12f, 1f);

            Button button = go.GetComponent<Button>();
            button.onClick.AddListener(action);

            Text label = CreateLabel(caption, go.transform, 27,
                new Vector2(0.5f, 0.5f), size, Color.white);
            RectTransform labelRect = label.GetComponent<RectTransform>();
            labelRect.anchorMin = Vector2.zero;
            labelRect.anchorMax = Vector2.one;
            labelRect.offsetMin = Vector2.zero;
            labelRect.offsetMax = Vector2.zero;
            return button;
        }

        private void ShowLogin()
        {
            if (loginPanel != null) loginPanel.SetActive(true);
            if (logoutButtonObject != null) logoutButtonObject.SetActive(false);
        }

        private void SetStatus(string message)
        {
            if (statusText != null) statusText.text = message;
            Debug.Log("[Jungle Escape Account] " + message);
        }

        private void SetBusy(bool value)
        {
            busy = value;
            if (signInButton != null) signInButton.interactable = !value;
            if (signUpButton != null) signUpButton.interactable = !value;
        }

        private async void StartUnityAccountFlow(bool createAccount)
        {
            if (busy) return;

            if (!servicesReady)
            {
                SetStatus("Account services are not ready. Please check the Unity Dashboard setup.");
                return;
            }

            try
            {
                SetBusy(true);
                SetStatus(createAccount
                    ? "Opening the secure account creation page..."
                    : "Opening the secure sign-in page...");

                if (PlayerAccountService.Instance.IsSignedIn)
                {
                    await SignInWithUnityTokenAsync();
                    return;
                }

                // This opens the browser. The SignedIn event completes game authentication.
                await PlayerAccountService.Instance.StartSignInAsync(createAccount);
                SetStatus("Complete sign-in in your browser, then return to Jungle Escape.");
            }
            catch (Exception exception)
            {
                SetStatus("Unity sign-in could not start: " + exception.Message);
                SetBusy(false);
            }
        }

        private async void OnUnityPlayerAccountSignedIn()
        {
            await SignInWithUnityTokenAsync();
        }

        private void OnUnityPlayerAccountSignInFailed(RequestFailedException exception)
        {
            SetStatus("Unity sign-in did not complete: " + exception.Message);
            SetBusy(false);
        }

        private async Task SignInWithUnityTokenAsync()
        {
            try
            {
                SetBusy(true);
                await AuthenticationService.Instance.SignInWithUnityAsync(
                    PlayerAccountService.Instance.AccessToken);
                await CompleteAuthenticatedFlowAsync();
            }
            catch (Exception exception)
            {
                SetStatus("Unity Account login failed: " + exception.Message);
                SetBusy(false);
            }
        }

        private async Task CompleteAuthenticatedFlowAsync()
        {
            await LoadBestScoreAsync();

            if (loginPanel != null) loginPanel.SetActive(false);
            if (logoutButtonObject != null) logoutButtonObject.SetActive(true);

            SetBusy(false);
            SetStatus("Welcome! Your account is signed in.");
            if (game != null) game.OnPlayerAuthenticated();
        }

        private string GetLocalBestScoreKey()
        {
            return LocalBestScorePrefix + AuthenticationService.Instance.PlayerId;
        }

        private async Task LoadBestScoreAsync()
        {
            string localKey = GetLocalBestScoreKey();
            BestScore = PlayerPrefs.GetInt(localKey, 0);

            if (!AuthenticationService.Instance.IsSignedIn) return;

            try
            {
                var result = await CloudSaveService.Instance.Data.Player.LoadAsync(
                    new HashSet<string> { CloudBestScoreKey });

                if (result.TryGetValue(CloudBestScoreKey, out var item))
                    BestScore = Mathf.Max(BestScore, item.Value.GetAs<int>());

                PlayerPrefs.SetInt(localKey, BestScore);
                PlayerPrefs.Save();

                // Keep the newest locally cached score if it is ahead of Cloud Save.
                await CloudSaveService.Instance.Data.Player.SaveAsync(
                    new Dictionary<string, object> { { CloudBestScoreKey, BestScore } });
            }
            catch (Exception exception)
            {
                Debug.LogWarning("Cloud Save is not ready; keeping the local best score. " +
                                 exception.Message);
            }
        }

        public async void SaveBestScoreAsync(int score)
        {
            if (!IsSignedIn || score <= BestScore) return;

            BestScore = score;
            PlayerPrefs.SetInt(GetLocalBestScoreKey(), BestScore);
            PlayerPrefs.Save();

            try
            {
                await CloudSaveService.Instance.Data.Player.SaveAsync(
                    new Dictionary<string, object> { { CloudBestScoreKey, BestScore } });
            }
            catch (Exception exception)
            {
                Debug.LogWarning("Could not sync best score to Cloud Save: " + exception.Message);
            }
        }

        public void SignOut()
        {
            if (servicesReady)
            {
                if (AuthenticationService.Instance.IsSignedIn)
                    AuthenticationService.Instance.SignOut(true);

                if (PlayerAccountService.Instance.IsSignedIn)
                    PlayerAccountService.Instance.SignOut();
            }

            if (game != null) game.OnPlayerLoggedOut();
            ShowLogin();
            SetStatus("You have been logged out. Sign in again to play.");
        }
    }
}