// Reviews table rendering
(function() {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

  let currentPage = 1;
  const itemsPerPage = 10;
  let allReviews = [];

  const classifyByRating = (rating) => {
    if (rating >= 4) return 'positive';
    if (rating <= 2) return 'negative';
    return 'neutral';
  };

  const normalizeReview = (review) => {
    const rating = parseInt(review.rating, 10) || 0;
    return {
      id: review.id || review.review_id || `${Date.now()}-${Math.random()}`,
      date: review.review_date || review.date || new Date().toISOString(),
      source: review.platform || review.source || 'Google Maps',
      reviewer: review.reviewer_name || review.reviewer || '',
      rating,
      text: review.text || review.review || '',
      sentiment: review.sentiment || classifyByRating(rating),
      topics: review.topics || []
    };
  };

  const normalizeReviews = (reviews) => (reviews || []).map(normalizeReview);

  // Load reviews data
  async function loadReviews(filters = {}) {
    try {
      if (window.api && window.api.reviews) {
        const data = await window.api.reviews.list({
          page: currentPage,
          limit: itemsPerPage,
          ...filters
        });
        allReviews = normalizeReviews(data.reviews || data || []);
        renderReviews(allReviews);
        const totalItems = data.total || allReviews.length;
        const totalPages = data.totalPages || Math.max(1, Math.ceil(totalItems / itemsPerPage));
        renderPagination(totalPages);
      } else {
        // Demo data
        allReviews = getDemoReviews();
        renderReviews(allReviews);
        renderPagination(Math.ceil(allReviews.length / itemsPerPage));
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      allReviews = getDemoReviews();
      renderReviews(allReviews);
    }
  }

  // Demo reviews data
  function getDemoReviews() {
    return [
      {
        id: 1,
        date: '2024-01-15',
        source: 'Google Maps',
        reviewer: 'John Doe',
        rating: 5,
        text: 'Excellent service and great food!',
        sentiment: 'positive',
        topics: ['service', 'food']
      },
      {
        id: 2,
        date: '2024-01-14',
        source: 'Instagram',
        reviewer: 'Jane Smith',
        rating: 4,
        text: 'Good experience overall, but could improve on wait times.',
        sentiment: 'neutral',
        topics: ['wait time']
      },
      {
        id: 3,
        date: '2024-01-13',
        source: 'Google Maps',
        reviewer: 'Bob Johnson',
        rating: 2,
        text: 'Not satisfied with the quality. Expected better.',
        sentiment: 'negative',
        topics: ['quality']
      }
    ];
  }

  // Render reviews table
  function renderReviews(reviews) {
    const tbody = document.getElementById('reviewsTableBody');
    if (!tbody) return;

    if (reviews.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No reviews found</td></tr>';
      return;
    }

    tbody.innerHTML = reviews.map(review => `
      <tr>
        <td>${formatDate(review.date)}</td>
        <td>${review.source}</td>
        <td>${renderRating(review.rating)}</td>
        <td>${review.text}</td>
        <td><span class="sentiment-badge sentiment-${review.sentiment}">${review.sentiment}</span></td>
        <td>${renderTopics(review.topics)}</td>
      </tr>
    `).join('');
  }

  // Format date
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Render rating stars
  function renderRating(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating) + ` ${rating}/5`;
  }

  // Render topics
  function renderTopics(topics) {
    if (!topics || topics.length === 0) return '-';
    return topics.map(topic => `<span class="topic-tag">${topic}</span>`).join(' ');
  }

  // Render pagination
  function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination || totalPages <= 1) {
      if (pagination) pagination.innerHTML = '';
      return;
    }

    const buttons = [];
    for (let i = 1; i <= totalPages; i++) {
      buttons.push(`
        <button 
          class="pagination-btn ${i === currentPage ? 'active' : ''}" 
          onclick="goToPage(${i})"
        >
          ${i}
        </button>
      `);
    }

    pagination.innerHTML = `
      <button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        Previous
      </button>
      ${buttons.join('')}
      <button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        Next
      </button>
    `;
  }

  // Go to page
  window.goToPage = function(page) {
    if (page < 1) return;
    currentPage = page;
    const filters = getFilters();
    loadReviews(filters);
  };

  // Get filters
  function getFilters() {
    const searchInput = document.getElementById('reviewSearch');
    const sentimentFilter = document.getElementById('sentimentFilter');
    
    return {
      search: searchInput?.value || '',
      sentiment: sentimentFilter?.value || ''
    };
  }

  // View review details
  window.viewReview = function(reviewId) {
    const review = allReviews.find(r => r.id === reviewId);
    if (review) {
      alert(`Review Details:\n\nDate: ${review.date}\nSource: ${review.source}\nReviewer: ${review.reviewer}\nRating: ${review.rating}/5\n\n${review.text}`);
    }
  };

  // Initialize search and filter
  function initFilters() {
    const searchInput = document.getElementById('reviewSearch');
    const sentimentFilter = document.getElementById('sentimentFilter');

    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          currentPage = 1;
          loadReviews(getFilters());
        }, 500);
      });
    }

    if (sentimentFilter) {
      sentimentFilter.addEventListener('change', () => {
        currentPage = 1;
        loadReviews(getFilters());
      });
    }
  }

  // Trigger scraper on demand and render results
  function initScraperTrigger() {
    const scrapeBtn = document.getElementById('scrapeReviewsBtn');
    if (!scrapeBtn || !window.api || !window.api.scraper) return;

    scrapeBtn.addEventListener('click', async () => {
      const defaultUrl = scrapeBtn.dataset.url || '';
      const businessId = scrapeBtn.dataset.businessId || '';
      const url = defaultUrl || window.prompt('Enter the reviews page URL to scrape');
      if (!url) return;

      const originalLabel = scrapeBtn.textContent;
      scrapeBtn.disabled = true;
      scrapeBtn.textContent = 'Scraping...';

      try {
        const data = await window.api.scraper.run({ url, business_id: businessId, max_scrolls: 2 });
        const scraped = normalizeReviews(data.reviews || []);
        if (scraped.length) {
          allReviews = [...scraped, ...allReviews];
          renderReviews(allReviews);
          renderPagination(Math.ceil(allReviews.length / itemsPerPage));
        }
      } catch (error) {
        console.error('Error running scraper:', error);
        alert('Unable to scrape reviews right now. Please try again.');
      } finally {
        scrapeBtn.disabled = false;
        scrapeBtn.textContent = originalLabel;
      }
    });
  }

  // Initialize
  function init() {
    initFilters();
    loadReviews();
    initScraperTrigger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export
  window.reviews = {
    loadReviews,
    renderReviews
  };
})();

