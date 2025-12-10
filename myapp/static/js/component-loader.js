/**
 * Component Loader - Dynamically loads HTML components
 */
(function() {
  'use strict';

  /**
   * Loads a component from the components/html directory
   * @param {string} componentName - Name of the component file (without .html)
   * @param {string} targetSelector - CSS selector for where to insert the component
   * @returns {Promise<void>}
   */
  async function loadComponent(componentName, targetSelector) {
    try {
      const response = await fetch(`../components/html/${componentName}.html`);
      if (!response.ok) {
        throw new Error(`Failed to load component: ${componentName}`);
      }
      const html = await response.text();
      const target = document.querySelector(targetSelector);
      if (target) {
        target.innerHTML = html;
      } else {
        console.warn(`Target selector "${targetSelector}" not found for component "${componentName}"`);
      }
    } catch (error) {
      console.error(`Error loading component ${componentName}:`, error);
    }
  }

  /**
   * Loads multiple components
   * @param {Array<{name: string, target: string}>} components
   */
  async function loadComponents(components) {
    await Promise.all(
      components.map(comp => loadComponent(comp.name, comp.target))
    );
  }

  /**
   * Initialize component loading when DOM is ready
   */
  async function init() {
    // Auto-load components marked with data-component attribute
    const componentElements = document.querySelectorAll('[data-component]');
    const loadPromises = [];
    
    componentElements.forEach((element) => {
      const componentName = element.getAttribute('data-component');
      const targetSelector = element.getAttribute('data-target') || null;
      if (componentName) {
        if (targetSelector) {
          loadPromises.push(loadComponent(componentName, targetSelector));
        } else {
          // If no target specified, replace the element itself
          loadPromises.push(
            (async () => {
              try {
                const response = await fetch(`../components/html/${componentName}.html`);
                if (response.ok) {
                  const html = await response.text();
                  element.outerHTML = html;
                  // Re-initialize navigation after components load
                  if (window.initNavigation) {
                    setTimeout(() => window.initNavigation(), 100);
                  }
                }
              } catch (error) {
                console.error(`Error loading component ${componentName}:`, error);
              }
            })()
          );
        }
      }
    });
    
    // Wait for all components to load
    await Promise.all(loadPromises);
    
    // Trigger navigation initialization after components are loaded
    if (window.initNavigation) {
      setTimeout(() => window.initNavigation(), 100);
    }
  }

  // Export for use in other scripts
  window.ComponentLoader = {
    load: loadComponent,
    loadMultiple: loadComponents
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

