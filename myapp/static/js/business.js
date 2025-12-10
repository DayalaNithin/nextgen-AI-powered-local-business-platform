// Business form handling
(function() {
  'use strict';

  // Initialize business form
  document.addEventListener('DOMContentLoaded', function() {
    const businessForm = document.getElementById('businessForm');
    
    if (businessForm) {
      businessForm.addEventListener('submit', handleBusinessFormSubmit);
    }
  });

  // Handle business form submission - allow Django to handle POST
  function handleBusinessFormSubmit(event) {
    const form = event.target;
    const submitButton = form.querySelector('.btn-submit');
    
    // Show loading state
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    
    // Let Django handle all validation and submission
    // Don't prevent default - allow the form to submit normally
    // If validation fails, Django will return the form with errors
    
    // Re-enable button after a timeout in case submission fails silently
    setTimeout(function() {
      if (submitButton.disabled) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }, 5000);
  }

  // Validate business form data
  function validateBusinessForm(data) {
    const errors = [];
    
    // Validate required fields
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Business name must be at least 2 characters long');
    }

    if (!data.location || data.location.trim().length < 2) {
      errors.push('Location is required');
    }

    // Only validate URL if it's provided (it's optional)
    if (data.google_maps_url && data.google_maps_url.trim() && !isValidUrl(data.google_maps_url)) {
      errors.push('Please enter a valid Google Maps or website URL');
    }

    if (!data.category) {
      errors.push('Please select a business type');
    }
    
    // Show errors if any
    if (errors.length > 0) {
      showNotification(errors.join('\n'), 'error');
      return false;
    }
    
    return true;
  }

  // Validate URL format
  function isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  // Show notification message
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      zIndex: '9999',
      opacity: '0',
      transform: 'translateX(100%)',
      transition: 'all 0.3s ease'
    });
    
    // Set background color based on type
    switch (type) {
      case 'success':
        notification.style.background = '#10b981';
        break;
      case 'error':
        notification.style.background = '#ef4444';
        break;
      default:
        notification.style.background = '#3b82f6';
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

})();
