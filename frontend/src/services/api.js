import axios from "axios";
import toast from "react-hot-toast";

// Debug: Check environment variables
console.log("=== API Configuration Debug ===");
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("MODE:", import.meta.env.MODE);
console.log("DEV:", import.meta.env.DEV);
console.log("PROD:", import.meta.env.PROD);

const baseURL = import.meta.env.VITE_API_URL || 'https://aqw-skins-backend.onrender.com/api/v1';
console.log("Using baseURL:", baseURL);

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add CSRF token if available
    const csrfToken = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content");
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }

    // Add language header
    const language = localStorage.getItem("i18nextLng") || "en";
    config.headers["Accept-Language"] = language;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors without infinite retry
    if (!error.response && !originalRequest._retry) {
      console.error('Network error:', error.message);
      toast.error('Unable to connect to server. Please check your connection.');
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const { useAuthStore } = await import("@store/authStore");
        const refreshSuccess = await useAuthStore
          .getState()
          .refreshAccessToken();

        if (refreshSuccess) {
          // Retry original request
          return api(originalRequest);
        } else {
          // Refresh failed, logout
          useAuthStore.getState().logout();
          window.location.href = "/login";
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      toast.error("You do not have permission to perform this action");
    }

    // Handle 404 Not Found - Don't show toast for all 404s
    if (error.response?.status === 404) {
      console.warn('Resource not found:', originalRequest.url);
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      toast.error("Too many requests. Please try again later.");
    }

    // Handle 500 Server Error - Don't spam toasts
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.status, originalRequest.url);
      // Only show toast if not already retrying
      if (!originalRequest._errorToastShown) {
        originalRequest._errorToastShown = true;
        toast.error("Server error. Please try again later.");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
