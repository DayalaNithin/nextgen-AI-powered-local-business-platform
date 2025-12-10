// Early theme bootstrapper
(function () {
  const THEME_KEY = 'localbiz-theme';
  const DEFAULT_THEME = 'dark';

  function readCookie(key) {
    const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function writeCookie(key, value) {
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
  }

  function getStoredTheme() {
    try {
      const fromStorage = window.localStorage.getItem(THEME_KEY);
      if (fromStorage) return fromStorage;
    } catch (_) {
      // ignore storage errors
    }
    const fromCookie = readCookie(THEME_KEY);
    return fromCookie || DEFAULT_THEME;
  }

  function persistTheme(theme) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch (_) {
      // ignore storage errors
    }
    writeCookie(THEME_KEY, theme);
  }

  function applyThemeClasses(theme) {
    const isLight = theme === 'light';

    const root = document.documentElement;
    if (root) {
      root.dataset.theme = theme;
      root.classList.toggle('theme-light', isLight);
    }

    const toggleBodyClass = () => {
      if (document.body) {
        document.body.classList.toggle('theme-light', isLight);
      }
    };

    if (document.body) {
      toggleBodyClass();
    } else {
      document.addEventListener('DOMContentLoaded', toggleBodyClass, { once: true });
    }
  }

  const initialTheme = getStoredTheme();
  applyThemeClasses(initialTheme);

  window.__themeController = {
    key: THEME_KEY,
    defaultTheme: DEFAULT_THEME,
    getTheme: getStoredTheme,
    applyTheme: applyThemeClasses,
    persistTheme(theme) {
      persistTheme(theme);
      applyThemeClasses(theme);
    }
  };
})();

