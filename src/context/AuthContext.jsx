import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginUser, registerUser } from "../lib/api";

const AuthContext = createContext(null);
const SESSION_KEY = "qm-app-session";
const THEME_KEY = "qm-app-theme";

function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );

    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

function buildUserFromToken(token) {
  const payload = parseJwt(token);
  const email = payload?.sub ?? "";
  const name = email ? email.split("@")[0] : "User";

  return {
    email,
    name
  };
}

function getStoredSession() {
  const storedValue = localStorage.getItem(SESSION_KEY);

  if (!storedValue) {
    return {
      token: "",
      user: null
    };
  }

  try {
    const parsed = JSON.parse(storedValue);
    if (!parsed?.token) {
      return {
        token: "",
        user: null
      };
    }

    return {
      token: parsed.token,
      user: parsed.user ?? buildUserFromToken(parsed.token)
    };
  } catch (error) {
    return {
      token: "",
      user: null
    };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "dark");

  useEffect(() => {
    if (session.token) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [session]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      token: session.token,
      user: session.user,
      theme,
      isAuthenticated: Boolean(session.token),
      async register(credentials) {
        return registerUser(credentials);
      },
      async login(credentials) {
        const token = await loginUser(credentials);
        const user = buildUserFromToken(token);

        setSession({
          token,
          user
        });

        return user;
      },
      logout() {
        setSession({
          token: "",
          user: null
        });
      },
      toggleTheme() {
        setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
      }
    }),
    [session, theme]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
