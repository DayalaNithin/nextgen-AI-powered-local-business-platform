// API service for all backend calls
(function() {
  'use strict';

  const CONFIG = window.CONFIG || {
    API_BASE_URL: 'http://localhost:3000/api',
    API_TIMEOUT: 30000
  };

  // Get auth token from storage
  function getAuthToken() {
    try {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    } catch (e) {
      return null;
    }
  }

  // Set auth token
  function setAuthToken(token, remember = false) {
    try {
      if (remember) {
        localStorage.setItem('auth_token', token);
      } else {
        sessionStorage.setItem('auth_token', token);
      }
    } catch (e) {
      console.error('Error storing auth token:', e);
    }
  }

  // Remove auth token
  function removeAuthToken() {
    try {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    } catch (e) {
      console.error('Error removing auth token:', e);
    }
  }

  // Make API request
  async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      timeout: CONFIG.API_TIMEOUT
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {})
      }
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

      const response = await fetch(url, {
        ...finalOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          removeAuthToken();
          window.location.href = '/login/';
          throw new Error('Unauthorized');
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // API methods
  const api = {
    // Auth endpoints
    auth: {
      login: async (email, password, remember = false) => {
        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        if (data.token) {
          setAuthToken(data.token, remember);
        }
        return data;
      },
      register: async (userData) => {
        return await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData)
        });
      },
      logout: async () => {
        try {
          await apiRequest('/auth/logout', { method: 'POST' });
        } finally {
          removeAuthToken();
        }
      },
      refresh: async () => {
        const data = await apiRequest('/auth/refresh', { method: 'POST' });
        if (data.token) {
          setAuthToken(data.token);
        }
        return data;
      }
    },

    // Business endpoints
    business: {
      create: async (businessData) => {
        return await apiRequest('/business', {
          method: 'POST',
          body: JSON.stringify(businessData)
        });
      },
      get: async (id) => {
        return await apiRequest(`/business/${id}`);
      },
      list: async () => {
        return await apiRequest('/business');
      },
      update: async (id, businessData) => {
        return await apiRequest(`/business/${id}`, {
          method: 'PUT',
          body: JSON.stringify(businessData)
        });
      },
      delete: async (id) => {
        return await apiRequest(`/business/${id}`, { method: 'DELETE' });
      }
    },

    // Reviews endpoints
    reviews: {
      list: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/reviews?${queryString}` : '/reviews';
        return await apiRequest(endpoint);
      },
      get: async (id) => {
        return await apiRequest(`/reviews/${id}`);
      },
      analyze: async (reviewIds) => {
        return await apiRequest('/reviews/analyze', {
          method: 'POST',
          body: JSON.stringify({ reviewIds })
        });
      },
      export: async (format = 'csv', params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/reviews/export/${format}?${queryString}` : `/reviews/export/${format}`;
        return await apiRequest(endpoint);
      }
    },

    // Dashboard endpoints
    dashboard: {
      getStats: async () => {
        return await apiRequest('/dashboard/stats', { method: 'GET' });
      },
      getSentiment: async (period = '30d') => {
        return await apiRequest(`/dashboard/sentiment?period=${period}`, { method: 'GET' });
      },
      getTrends: async (period = '30d') => {
        return await apiRequest(`/dashboard/trends?period=${period}`, { method: 'GET' });
      },
      getInsights: async () => {
        return await apiRequest('/dashboard/insights', { method: 'GET' });
      },
      getTopicDistribution: async () => {
        return await apiRequest('/dashboard/topic-distribution', { method: 'GET' });
      },
      getTopPraises: async () => {
        return await apiRequest('/dashboard/top-praises', { method: 'GET' });
      },
      getTopComplaints: async () => {
        return await apiRequest('/dashboard/top-complaints', { method: 'GET' });
      },
      getCompetitorComparison: async () => {
        return await apiRequest('/dashboard/competitor-comparison', { method: 'GET' });
      },
      getReviewAnalysis: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/dashboard/review-analysis?${queryString}` : '/dashboard/review-analysis';
        return await apiRequest(endpoint, { method: 'GET' });
      }
    },

    // Scraper
    scraper: {
      run: async (payload) => {
        return await apiRequest('/scraper/run', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
    }
  };

  // Export
  window.api = api;
  window.apiUtils = {
    getAuthToken,
    setAuthToken,
    removeAuthToken
  };
})();

