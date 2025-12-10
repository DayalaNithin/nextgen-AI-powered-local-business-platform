// Dashboard rendering logic
(function() {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // Load dashboard data
  async function loadDashboardData() {
    try {
      if (window.api && window.api.dashboard) {
        const [stats, sentiment, trends, insights, topicDistribution, topPraises, topComplaints, competitorComparison, reviewAnalysis] = await Promise.all([
          window.api.dashboard.getStats(),
          window.api.dashboard.getSentiment(),
          window.api.dashboard.getTrends(),
          window.api.dashboard.getInsights(),
          window.api.dashboard.getTopicDistribution().catch(() => null),
          window.api.dashboard.getTopPraises().catch(() => null),
          window.api.dashboard.getTopComplaints().catch(() => null),
          window.api.dashboard.getCompetitorComparison().catch(() => null),
          window.api.dashboard.getReviewAnalysis().catch(() => null)
        ]);

        updateStats(stats);
        updateInsights(insights);
        updateTopicDistribution(topicDistribution);
        updateTopPraises(topPraises);
        updateTopComplaints(topComplaints);
        // Charts will be updated by charts.js
        if (window.charts) {
          window.charts.updateSentimentChart(sentiment);
          window.charts.updateTrendChart(trends);
        }
      } else {
        // Demo data
        console.log('Using demo data - API not available');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  // Update topic distribution
  function updateTopicDistribution(data) {
    if (!data) return;
    // Topic distribution will be updated via API data
  }

  // Update top praises
  function updateTopPraises(data) {
    if (!data) return;
    const container = document.querySelector('.chart-card:has(.strengths .title:contains("Top Praises"))');
    if (container && data.items) {
      const ul = container.querySelector('.strengths ul');
      if (ul) {
        ul.innerHTML = data.items.map(item => `<li>${item}</li>`).join('');
      }
    }
  }

  // Update top complaints
  function updateTopComplaints(data) {
    if (!data) return;
    const container = document.querySelector('.chart-card:has(.weaknesses .title:contains("Top Complaints"))');
    if (container && data.items) {
      const ul = container.querySelector('.weaknesses ul');
      if (ul) {
        ul.innerHTML = data.items.map(item => `<li>${item}</li>`).join('');
      }
    }
  }

  // Update stats cards
  function updateStats(stats) {
    if (!stats) return;

    const statCards = {
      'Positive Mentions': stats.positiveMentions || 1248,
      'Customer NPS': stats.nps || 62,
      'Avg. Response Time': stats.avgResponseTime || '1.8h',
      'Escalations': stats.escalations || 32
    };

    const statCardsElements = $$('.stat-card');
    statCardsElements.forEach((card, index) => {
      const label = card.querySelector('.label')?.textContent;
      const valueElement = card.querySelector('.value');
      if (valueElement && label && statCards[label]) {
        valueElement.textContent = statCards[label];
      }
    });
  }

  // Update insights
  function updateInsights(insights) {
    const container = document.getElementById('insights-container');
    if (!container || !insights) return;

    if (window.loadComponent) {
      // Load insight cards as components
      insights.forEach(insight => {
        loadInsightCard(container, insight);
      });
    } else {
      // Fallback: render directly
      container.innerHTML = insights.map(insight => `
        <div class="insight-card">
          <p class="pill">AI Insight</p>
          <h4>${insight.title}</h4>
          <p>${insight.description}</p>
        </div>
      `).join('');
    }
  }

  // Load insight card component
  async function loadInsightCard(container, insight) {
    try {
      const response = await fetch('components/insight-card.html');
      if (response.ok) {
        let html = await response.text();
        html = html.replace('{{title}}', insight.title || 'Insight');
        html = html.replace('{{description}}', insight.description || '');
        const div = document.createElement('div');
        div.innerHTML = html;
        container.appendChild(div.firstElementChild);
      }
    } catch (error) {
      console.error('Error loading insight card:', error);
    }
  }

  // Stat card interactions
  function initStatCards() {
    const cards = $$('.stat-card');
    cards.forEach(card => {
      if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', 'false');

      const toggle = () => {
        const pressed = card.getAttribute('aria-pressed') === 'true';
        card.setAttribute('aria-pressed', String(!pressed));
        card.classList.toggle('active', !pressed);
      };

      on(card, 'click', toggle);
      on(card, 'keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          toggle();
        }
      });
    });
  }

  // Business form handler
  function initBusinessForm() {
    const form = document.getElementById('businessForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('businessName').value,
        type: document.getElementById('businessType').value,
        googleMapsUrl: document.getElementById('googleMapsUrl').value,
        instagramHandle: document.getElementById('instagramHandle').value
      };

      try {
        if (window.api && window.api.business) {
          const result = await window.api.business.create(formData);
          alert('Business registered successfully! Redirecting to dashboard...');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
        } else {
          // Demo mode
          alert('Business information submitted! Redirecting to dashboard...');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
        }
      } catch (error) {
        console.error('Error submitting business form:', error);
        alert('Error submitting form. Please try again.');
      }
    });
  }

  // Initialize hamburger menu (only if utils.js hasn't already handled it)
  function initHamburgerMenu() {
    // Skip if utils.js is loaded and has already initialized navigation
    if (window.utils && window.utils.initNavigation) {
      return;
    }
    
    const hamburger = document.getElementById('hamburgerMenu');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!hamburger || !sidebar || !overlay) return;
    
    // Check if already initialized
    if (hamburger.dataset.initialized === 'true') return;
    hamburger.dataset.initialized = 'true';
    
    const toggleSidebar = () => {
      const isActive = sidebar.classList.contains('active');
      if (isActive) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
      } else {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    };
    
    hamburger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    });
    
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSidebar();
    });
    
    // Close sidebar when clicking on a nav link
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
    
    // Close sidebar on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Initialize
  function init() {
    loadDashboardData();
    initStatCards();
    initBusinessForm();
    initHamburgerMenu();
    
    // Initialize theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('change', function() {
        document.body.classList.toggle('dark-theme');
        const label = document.getElementById('themeToggleLabel');
        if (label) {
          label.textContent = this.checked ? 'Light' : 'Dark';
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export
  window.dashboard = {
    loadDashboardData,
    updateStats,
    updateInsights
  };
})();

