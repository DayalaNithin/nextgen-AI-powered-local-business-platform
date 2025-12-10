// API Configuration
const CONFIG = {
  API_BASE_URL: '/api',
  API_TIMEOUT: 30000,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh'
    },
    BUSINESS: {
      CREATE: '/business',
      GET: '/business',
      UPDATE: '/business/:id',
      DELETE: '/business/:id'
    },
    REVIEWS: {
      LIST: '/reviews',
      GET: '/reviews/:id',
      ANALYZE: '/reviews/analyze',
      EXPORT: '/reviews/export'
    },
    DASHBOARD: {
      STATS: '/dashboard/stats',
      SENTIMENT: '/dashboard/sentiment',
      TRENDS: '/dashboard/trends',
      INSIGHTS: '/dashboard/insights'
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}

