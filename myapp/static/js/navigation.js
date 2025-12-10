// Navigation functionality
(function() {
  'use strict';

  // Wait for DOM to be ready
  function initNavigation() {
    // Hamburger menu toggle
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function toggleSidebar() {
      if (!sidebar || !sidebarOverlay || !hamburgerMenu) return;
      
      const isActive = sidebar.classList.contains('active');
      
      if (isActive) {
        // Close sidebar
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        document.body.style.overflow = '';
      } else {
        // Open sidebar
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        hamburgerMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeSidebar() {
      if (!sidebar || !sidebarOverlay || !hamburgerMenu) return;
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      hamburgerMenu.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (hamburgerMenu) {
      hamburgerMenu.addEventListener('click', toggleSidebar);
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Close sidebar on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
        closeSidebar();
      }
    });

    // Close sidebar when clicking on a link
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        // Small delay to allow navigation
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }
})();

