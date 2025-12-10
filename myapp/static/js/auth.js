// Authentication handling and JWT management
(function() {
  'use strict';

  // Wait for DOM to be ready
  function initAuth() {
    // Django handles form submission and session authentication
    // JavaScript only provides UI feedback and optional JWT token for API calls
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Signing in...';
        }
        
        // Let Django handle the form submission - it will create session and redirect
        // No preventDefault - form submits normally to Django login view
      });
    }

    // Registration form handler - Let Django handle form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', function(e) {
        // Client-side validation before submission
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const terms = document.getElementById('terms')?.checked || false;
        
        // Validation
        if (!fullName || !email || !password || !confirmPassword) {
          e.preventDefault();
          alert('Please fill in all fields');
          return;
        }

        if (password.length < 8) {
          e.preventDefault();
          alert('Password must be at least 8 characters long');
          return;
        }

        if (password !== confirmPassword) {
          e.preventDefault();
          alert('Passwords do not match!');
          return;
        }

        if (!terms) {
          e.preventDefault();
          alert('Please agree to the Terms of Service and Privacy Policy');
          return;
        }

        // Show loading state
        const submitButton = registerForm.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Creating account...';
        }
        
        // Let Django handle the form submission - it will create user, login, and redirect
        // No preventDefault - form submits normally to Django registration view
      });
    }

    // Note: Django handles authentication redirects via session-based auth
    // JWT tokens are only for API calls, not page access
    // Removed auto-redirect to prevent infinite loops with Django's @login_required
  }

  // Handle auth status check for showing/hiding UI elements
  function checkAuthStatus() {
    const authButtons = document.getElementById('authButtons');
    const profileMenu = document.getElementById('profileMenu');
    
    if (window.apiUtils && window.apiUtils.getAuthToken()) {
      // User is logged in
      if (authButtons) authButtons.style.display = 'none';
      if (profileMenu) profileMenu.style.display = 'block';
    } else {
      // User is not logged in
      if (authButtons) authButtons.style.display = 'flex';
      if (profileMenu) profileMenu.style.display = 'none';
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initAuth();
      checkAuthStatus();
    });
  } else {
    initAuth();
    checkAuthStatus();
  }
})();

