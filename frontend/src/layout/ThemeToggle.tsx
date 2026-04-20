import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function readTheme(): Theme {
  const saved = localStorage.getItem("sgu-theme");
  if (saved === "light" || saved === "dark") return saved;
  return "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light",
  );

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("sgu-theme", next);
  }

  return (
    <button
      type="button"
      className="topbar-action-btn topbar-action-btn--theme theme-toggle"
      onClick={toggle}
      title={theme === "dark" ? "切换浅色" : "切换深色"}
      aria-label="切换明暗主题"
    >
      <span className="topbar-action-btn__emoji" aria-hidden>
        {theme === "dark" ? "☀" : "🌙"}
      </span>
    </button>
  );
}
