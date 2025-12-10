// Utility functions and theme management
(function () {
  'use strict';

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

  // Helper functions
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // Theme management
  const themeController = window.__themeController || null;
  const THEME_KEY = themeController?.key || 'localbiz-theme';
  const DEFAULT_THEME = themeController?.defaultTheme || 'dark';

  function getStoredTheme() {
    if (themeController?.getTheme) {
      return themeController.getTheme();
    }
    try {
      return localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
    } catch (_) {
      return DEFAULT_THEME;
    }
  }

  function applyTheme(theme) {
    if (themeController?.applyTheme) {
      themeController.applyTheme(theme);
      return;
    }

    const isLight = theme === 'light';
    if (document.documentElement) {
      document.documentElement.classList.toggle('theme-light', isLight);
    }
    if (document.body) {
      document.body.classList.toggle('theme-light', isLight);
    }
  }

  function setTheme(theme) {
    if (themeController?.persistTheme) {
      themeController.persistTheme(theme);
    } else {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (_) {
        // ignore storage errors
      }
      applyTheme(theme);
    }
    updateThemeControls(theme);
  }

  function updateThemeControls(theme) {
    const toggle = document.getElementById('themeToggle');
    const label = document.getElementById('themeToggleLabel');
    if (toggle) {
      toggle.checked = theme === 'light';
    }
    if (label) {
      label.textContent = theme === 'light' ? 'Light' : 'Dark';
    }
  }

  function initTheme() {
    const stored = getStoredTheme();
    const initialTheme = stored === 'light' ? 'light' : 'dark';
    applyTheme(initialTheme);
    updateThemeControls(initialTheme);

    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.addEventListener('change', (event) => {
        const nextTheme = event.target.checked ? 'light' : 'dark';
        setTheme(nextTheme);
      });
    }

    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', (event) => {
      if (event.key !== THEME_KEY) return;
      const incomingTheme = event.newValue || DEFAULT_THEME;
      applyTheme(incomingTheme);
      updateThemeControls(incomingTheme);
    });
  }

  // Navigation functionality
  function initNavigation() {
    // Hamburger menu toggle
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (!hamburgerMenu || !sidebar || !sidebarOverlay) return;

    // Mark as initialized to prevent duplicate handlers
    if (hamburgerMenu.dataset.navInitialized === 'true') return;
    hamburgerMenu.dataset.navInitialized = 'true';

    function toggleSidebar() {
      const isActive = sidebar.classList.contains('active');
      
      if (isActive) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        document.body.style.overflow = '';
      } else {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        hamburgerMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeSidebar() {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      hamburgerMenu.classList.remove('active');
      document.body.style.overflow = '';
    }

    hamburgerMenu.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    });

    sidebarOverlay.addEventListener('click', (e) => {
      e.preventDefault();
      closeSidebar();
    });

    // Close sidebar on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('active')) {
        closeSidebar();
      }
    });

    // Close sidebar when clicking on a link
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        setTimeout(closeSidebar, 150);
      });
    });

    // Profile dropdown toggle
    const profileMenu = document.getElementById('profileMenu');
    const profileTrigger = document.getElementById('profileTrigger');
    const profileDropdown = document.getElementById('profileDropdown');

    function toggleProfileDropdown() {
      if (profileMenu) {
        profileMenu.classList.toggle('active');
      }
    }

    function closeProfileDropdown() {
      if (profileMenu) {
        profileMenu.classList.remove('active');
      }
    }

    if (profileTrigger) {
      profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleProfileDropdown();
      });
    }

    // Close profile dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (profileMenu && !profileMenu.contains(e.target)) {
        closeProfileDropdown();
      }
    });

    // Close profile dropdown on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && profileMenu && profileMenu.classList.contains('active')) {
        closeProfileDropdown();
      }
    });
  }

  // Load components
  async function loadComponent(containerId, componentPath) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      // Check if we're in html folder and adjust path
      const currentPath = window.location.pathname;
      let adjustedPath = componentPath;
      
      if (currentPath.includes('/html/')) {
        // If we're in html folder, components are in ../components/
        adjustedPath = '../components/' + componentPath.split('/').pop();
      }
      
      const response = await fetch(adjustedPath);
      if (response.ok) {
        const html = await response.text();
        container.innerHTML = html;
        // Reinitialize navigation after loading
        if (containerId === 'navbar-container' || containerId === 'sidebar-container') {
          setTimeout(initNavigation, 100);
        }
      }
    } catch (error) {
      console.error(`Error loading component ${componentPath}:`, error);
    }
  }

  // Initialize
  function init() {
    initTheme();
    initNavigation();
    
    // Load components if containers exist
    if (document.getElementById('navbar-container')) {
      loadComponent('navbar-container', 'components/navbar.html');
    }
    if (document.getElementById('sidebar-container')) {
      loadComponent('sidebar-container', 'components/sidebar.html');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export utilities
  window.utils = {
    $,
    $$,
    on,
    loadComponent,
    initTheme,
    initNavigation
  };
})();

