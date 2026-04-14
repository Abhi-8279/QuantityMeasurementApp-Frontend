import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Ruler, Scale, Thermometer, Waves } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const marketingChips = [
  { label: "Length", icon: <Ruler size={16} /> },
  { label: "Weight", icon: <Scale size={16} /> },
  { label: "Volume", icon: <Waves size={16} /> },
  { label: "Temperature", icon: <Thermometer size={16} /> }
];

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_SCRIPT_ID = "google-identity-services";

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="google-mark" viewBox="0 0 24 24">
      <path
        d="M21.805 12.23c0-.76-.068-1.49-.195-2.19H12v4.145h5.49a4.694 4.694 0 0 1-2.04 3.082v2.56h3.3c1.932-1.78 3.055-4.405 3.055-7.597Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.075-.915 6.765-2.473l-3.3-2.56c-.915.613-2.085.978-3.465.978-2.66 0-4.914-1.798-5.72-4.215H2.868v2.64A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.28 13.73A6.007 6.007 0 0 1 5.96 12c0-.6.11-1.18.32-1.73V7.63H2.868A10.004 10.004 0 0 0 2 12c0 1.61.385 3.135 1.068 4.37l3.212-2.64Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.055c1.5 0 2.848.515 3.91 1.525l2.932-2.933C17.07 2.995 14.755 2 12 2A10 10 0 0 0 3.068 7.63l3.212 2.64C7.086 7.853 9.34 6.055 12 6.055Z"
        fill="#EA4335"
      />
    </svg>
  );
}

let googleScriptPromise;

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(window.google);
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google sign-in.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google sign-in."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

function getGoogleAccessToken(clientId) {
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      prompt: "select_account",
      callback: (response) => {
        if (response.error) {
          reject(new Error("Google sign-in was cancelled or blocked."));
          return;
        }

        resolve(response.access_token);
      }
    });

    tokenClient.requestAccessToken();
  });
}

function buildGooglePassword(profile) {
  return `GoogleAuth::${profile.sub}::${profile.email.toLowerCase()}`;
}

function AuthPage() {
  const navigate = useNavigate();
  const { login, register, theme, toggleTheme } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await login(loginForm);
      navigate("/workspace");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password
      });

      setSuccessMessage(
        typeof response === "string" ? response : "Registered successfully. Please log in."
      );
      setLoginForm((current) => ({
        ...current,
        email: registerForm.email
      }));
      setActiveTab("login");
      setRegisterForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleContinue() {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    if (!GOOGLE_CLIENT_ID) {
      setError("Google sign-in is not configured yet. Add VITE_GOOGLE_CLIENT_ID in frontend/.env.");
      setLoading(false);
      return;
    }

    if (!GOOGLE_CLIENT_ID.includes(".apps.googleusercontent.com")) {
      setError(
        "Google OAuth client ID looks invalid. Use the Web Client ID ending with .apps.googleusercontent.com."
      );
      setLoading(false);
      return;
    }

    try {
      await loadGoogleIdentityScript();
      const accessToken = await getGoogleAccessToken(GOOGLE_CLIENT_ID);
      const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!profileResponse.ok) {
        throw new Error("Could not read your Google account details.");
      }

      const profile = await profileResponse.json();

      if (!profile.email || !profile.sub) {
        throw new Error("Google did not return a usable account.");
      }

      const password = buildGooglePassword(profile);

      try {
        await register({
          name: profile.name || profile.email.split("@")[0],
          email: profile.email,
          password
        });
      } catch (requestError) {
        if (!/already exists/i.test(requestError.message)) {
          throw requestError;
        }
      }

      await login({
        email: profile.email,
        password
      });

      navigate("/workspace");
    } catch (requestError) {
      setError(requestError.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-mode-toggle">
        <button className="ghost-pill" onClick={toggleTheme} type="button">
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <section className="hero-card">
        <div className="hero-logo">
          <FlaskConical size={42} />
        </div>

        <div className="hero-copy">
          <h1>
            Quantity
            <br />
            Measurement
            <br />
            App
          </h1>
          <p>
            Measure, compare, convert, and calculate quantities with a cleaner workflow
            built for quick decisions.
          </p>
        </div>

        <div className="chip-grid">
          {marketingChips.map((chip) => (
            <div className="feature-chip" key={chip.label}>
              <span className="feature-chip-icon">{chip.icon}</span>
              <span>{chip.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="auth-card">
        <div className="tab-strip">
          <button
            className={activeTab === "login" ? "tab active" : "tab"}
            onClick={() => {
              setActiveTab("login");
              setError("");
              setSuccessMessage("");
            }}
            type="button"
          >
            Login
          </button>
          <button
            className={activeTab === "signup" ? "tab active" : "tab"}
            onClick={() => {
              setActiveTab("signup");
              setError("");
              setSuccessMessage("");
            }}
            type="button"
          >
            Signup
          </button>
        </div>

        {activeTab === "login" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              <span>Email Id</span>
              <input
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="user1@gmail.com"
                required
                type="email"
                value={loginForm.email}
              />
            </label>

            <label>
              <span>Password</span>
              <input
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Enter your password"
                required
                type="password"
                value={loginForm.password}
              />
            </label>

            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "Signing in..." : "Login"}
            </button>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <button
              className="secondary-button google-button"
              disabled={loading}
              onClick={handleGoogleContinue}
              type="button"
            >
              <GoogleMark />
              Continue with Google
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <label>
              <span>Name</span>
              <input
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Your name"
                required
                value={registerForm.name}
              />
            </label>

            <label>
              <span>Email Id</span>
              <input
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="name@example.com"
                required
                type="email"
                value={registerForm.email}
              />
            </label>

            <label>
              <span>Password</span>
              <input
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Choose a password"
                required
                type="password"
                value={registerForm.password}
              />
            </label>

            <label>
              <span>Confirm Password</span>
              <input
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value
                  }))
                }
                placeholder="Confirm password"
                required
                type="password"
                value={registerForm.confirmPassword}
              />
            </label>

            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        {error ? <p className="status-message error">{error}</p> : null}
        {successMessage ? <p className="status-message success">{successMessage}</p> : null}
      </section>
    </div>
  );
}

export default AuthPage;
