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
    /// Required sign-in gate for Jungle Escape. Email-based sign-in is provided by
    /// the hosted Unity Player Accounts flow; Username/Password is the second option.
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
        private InputField usernameInput;
        private InputField passwordInput;
        private Text statusText;
        private Button unitySignInButton;
        private Button unitySignUpButton;
        private Button usernameSignInButton;
        private Button usernameSignUpButton;
        private bool servicesReady;
        private bool busy;

        public int BestScore { get; private set; }
        public bool IsSignedIn => servicesReady && AuthenticationService.Instance.IsSignedIn;

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
                try { PlayerAccountService.Instance.SignedIn -= OnUnityPlayerAccountSignedIn; }
                catch (Exception exception) { Debug.LogWarning("Could not detach Player Accounts event: " + exception.Message); }
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

                // SignInAnonymouslyAsync restores the cached session when one exists.
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

                        // Do not silently let an anonymous guest bypass the login screen.
                        if (AuthenticationService.Instance.IsSignedIn)
                            AuthenticationService.Instance.SignOut(true);
                    }
                    catch (Exception restoreException)
                    {
                        Debug.LogWarning("Jungle Escape cached sign-in could not be restored: " +
                                         restoreException.Message);
                        if (AuthenticationService.Instance.IsSignedIn)
                            AuthenticationService.Instance.SignOut(true);
                    }
                }

                ShowLogin();
                SetStatus("Sign in with your Unity Account email, or use a username and password.");
                return false;
            }
            catch (Exception exception)
            {
                servicesReady = false;
                ShowLogin();
                SetStatus("Account service setup is incomplete: " + exception.Message +
                          "\nPlease check the Unity project link and Cloud Services setup.");
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

            CreateLabel("JUNGLE ESCAPE", loginPanel.transform, 58,
                new Vector2(0.5f, 0.91f), new Vector2(900f, 110f),
                new Color(0.94f, 0.78f, 0.38f));
            CreateLabel("PLAYER ACCOUNT", loginPanel.transform, 30,
                new Vector2(0.5f, 0.84f), new Vector2(900f, 70f), Color.white);

            unitySignInButton = CreateButton("SIGN IN WITH EMAIL", loginPanel.transform,
                new Vector2(0.5f, 0.74f), new Vector2(760f, 100f), StartUnitySignIn);
            unitySignUpButton = CreateButton("CREATE UNITY ACCOUNT", loginPanel.transform,
                new Vector2(0.5f, 0.65f), new Vector2(760f, 100f), StartUnitySignUp);

            CreateLabel("OR USE USERNAME + PASSWORD", loginPanel.transform, 27,
                new Vector2(0.5f, 0.55f), new Vector2(900f, 70f), Color.white);

            usernameInput = CreateInput("Username (3-20 characters)", loginPanel.transform,
                new Vector2(0.5f, 0.47f), false);
            passwordInput = CreateInput("Password (8-30 characters)", loginPanel.transform,
                new Vector2(0.5f, 0.38f), true);

            usernameSignInButton = CreateButton("LOGIN", loginPanel.transform,
                new Vector2(0.5f, 0.28f), new Vector2(350f, 92f),
                () => SignInWithUsernameAsync(false));
            usernameSignUpButton = CreateButton("SIGN UP", loginPanel.transform,
                new Vector2(0.5f, 0.20f), new Vector2(350f, 92f),
                () => SignInWithUsernameAsync(true));

            statusText = CreateLabel("Please sign in to continue.", loginPanel.transform, 22,
                new Vector2(0.5f, 0.09f), new Vector2(940f, 150f), new Color(0.86f, 0.88f, 0.82f));

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

        private static InputField CreateInput(string placeholderText, Transform parent,
            Vector2 anchor, bool password)
        {
            GameObject go = new GameObject(placeholderText + "_Input",
                typeof(RectTransform), typeof(Image), typeof(InputField));
            go.transform.SetParent(parent, false);
            RectTransform rect = go.GetComponent<RectTransform>();
            rect.anchorMin = anchor;
            rect.anchorMax = anchor;
            rect.sizeDelta = new Vector2(760f, 88f);
            rect.anchoredPosition = Vector2.zero;
            go.GetComponent<Image>().color = new Color(0.92f, 0.92f, 0.88f, 1f);

            Text text = CreateInputText("InputText", go.transform, Color.black);
            Text placeholder = CreateInputText(placeholderText, go.transform,
                new Color(0.35f, 0.36f, 0.34f, 0.8f));
            placeholder.text = placeholderText;

            InputField input = go.GetComponent<InputField>();
            input.textComponent = text;
            input.placeholder = placeholder;
            input.lineType = InputField.LineType.SingleLine;
            input.contentType = password ? InputField.ContentType.Password : InputField.ContentType.Standard;
            input.characterLimit = password ? 30 : 20;
            return input;
        }

        private static Text CreateInputText(string name, Transform parent, Color color)
        {
            GameObject go = new GameObject(name, typeof(RectTransform), typeof(Text));
            go.transform.SetParent(parent, false);
            RectTransform rect = go.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = new Vector2(24f, 8f);
            rect.offsetMax = new Vector2(-24f, -8f);
            Text text = go.GetComponent<Text>();
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = 28;
            text.alignment = TextAnchor.MiddleLeft;
            text.color = color;
            return text;
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
            if (unitySignInButton != null) unitySignInButton.interactable = !value;
            if (unitySignUpButton != null) unitySignUpButton.interactable = !value;
            if (usernameSignInButton != null) usernameSignInButton.interactable = !value;
            if (usernameSignUpButton != null) usernameSignUpButton.interactable = !value;
        }

        private async void StartUnitySignIn()
        {
            await StartUnityAccountFlowAsync(false);
        }

        private async void StartUnitySignUp()
        {
            await StartUnityAccountFlowAsync(true);
        }

        private async Task StartUnityAccountFlowAsync(bool createAccount)
        {
            if (busy) return;
            if (!servicesReady)
            {
                SetStatus("Account services are not ready. Please restart the game.");
                return;
            }

            try
            {
                SetBusy(true);
                SetStatus(createAccount
                    ? "Opening Unity Account sign-up in your browser..."
                    : "Opening Unity Account sign-in in your browser...");

                if (PlayerAccountService.Instance.IsSignedIn)
                {
                    await SignInWithUnityTokenAsync();
                    return;
                }

                // The SignedIn event completes the app sign-in after the browser returns.
                await PlayerAccountService.Instance.StartSignInAsync(createAccount);
                SetStatus("Finish signing in inside the browser, then return to the game.");
            }
            catch (Exception exception)
            {
                SetStatus("Unity Account sign-in could not start: " + exception.Message);
                SetBusy(false);
            }
        }

        private async void OnUnityPlayerAccountSignedIn()
        {
            await SignInWithUnityTokenAsync();
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

        private async void SignInWithUsernameAsync(bool createAccount)
        {
            if (busy) return;
            if (!servicesReady)
            {
                SetStatus("Account services are not ready. Please restart the game.");
                return;
            }

            string username = usernameInput != null ? usernameInput.text.Trim() : string.Empty;
            string password = passwordInput != null ? passwordInput.text : string.Empty;
            if (username.Length < 3 || username.Length > 20)
            {
                SetStatus("Username must be 3 to 20 characters.");
                return;
            }
            if (password.Length < 8 || password.Length > 30)
            {
                SetStatus("Password must be 8 to 30 characters.");
                return;
            }

            if (createAccount && !IsStrongPassword(password))
            {
                SetStatus("Use at least one lowercase, one uppercase, one number and one symbol in the password.");
                return;
            }

            try
            {
                SetBusy(true);
                SetStatus(createAccount ? "Creating your player account..." : "Signing in...");
                if (createAccount)
                    await AuthenticationService.Instance.SignUpWithUsernamePasswordAsync(username, password);
                else
                    await AuthenticationService.Instance.SignInWithUsernamePasswordAsync(username, password);

                await CompleteAuthenticatedFlowAsync();
            }
            catch (Exception exception)
            {
                SetStatus((createAccount ? "Sign-up failed: " : "Login failed: ") + exception.Message);
                SetBusy(false);
            }
        }

        private static bool IsStrongPassword(string password)
        {
            bool lower = false, upper = false, digit = false, symbol = false;
            foreach (char character in password)
            {
                lower |= char.IsLower(character);
                upper |= char.IsUpper(character);
                digit |= char.IsDigit(character);
                symbol |= !char.IsLetterOrDigit(character);
            }
            return lower && upper && digit && symbol;
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

                // Upload a locally cached record if it is newer than the cloud record.
                await CloudSaveService.Instance.Data.Player.SaveAsync(
                    new Dictionary<string, object> { { CloudBestScoreKey, BestScore } });
            }
            catch (Exception exception)
            {
                Debug.LogWarning("Jungle Escape Cloud Save is not ready; keeping local best score. " +
                                 exception.Message);
            }
        }

        public async void SaveBestScoreAsync(int score)
        {
            if (!servicesReady || !AuthenticationService.Instance.IsSignedIn || score <= BestScore) return;
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
                Debug.LogWarning("Could not sync Jungle Escape best score to Cloud Save: " +
                                 exception.Message);
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
            SetStatus("You have been logged out. Sign in to play again.");
        }
    }
}