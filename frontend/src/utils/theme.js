const THEME_KEY = "mailnova_theme";

// Reads the person's last-chosen theme so the app opens the same way
// every time, instead of always resetting to light mode.
export const getStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY) === "dark";
  } catch {
    return false;
  }
};

export const setStoredTheme = (isDark) => {
  try {
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  } catch {
    // Ignore storage errors (e.g. private browsing) - theme just won't persist.
  }
};
