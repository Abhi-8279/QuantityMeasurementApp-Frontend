import { History, LogOut, MoonStar, Scale, SunMedium } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppShell({ title, subtitle, activePage, children }) {
  const navigate = useNavigate();
  const { logout, theme, toggleTheme, user } = useAuth();
  const isWorkspace = activePage === "workspace";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <div className="topbar-actions">
          <button className="ghost-pill" onClick={toggleTheme} type="button">
            {theme === "dark" ? <SunMedium size={16} /> : <MoonStar size={16} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          <div className="ghost-pill user-pill">{user?.email || "Signed in"}</div>

          <button
            className="ghost-pill"
            onClick={() => navigate(isWorkspace ? "/history" : "/workspace")}
            type="button"
          >
            {isWorkspace ? <History size={16} /> : <Scale size={16} />}
            {isWorkspace ? "History" : "Calculator"}
          </button>

          <button
            className="ghost-pill"
            onClick={() => {
              logout();
              navigate("/");
            }}
            type="button"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="page-card">{children}</main>
    </div>
  );
}

export default AppShell;
