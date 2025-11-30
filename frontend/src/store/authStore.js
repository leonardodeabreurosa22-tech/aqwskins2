import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@services/api";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post("/auth/login", { email, password });
          const { user, token, refreshToken } = response.data.data;

          // Normalize user data - ensure balance is a number
          const normalizedUser = {
            ...user,
            balance: parseFloat(user.balance) || 0
          };

          set({
            user: normalizedUser,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Set token in API headers
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          return { success: true };
        } catch (error) {
          const errorMessage =
            error.response?.data?.error?.message ||
            error.response?.data?.message ||
            "Login failed";
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // Register
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post("/auth/register", userData);
          const { user, token, refreshToken } = response.data.data;

          // Normalize user data - ensure balance is a number
          const normalizedUser = {
            ...user,
            balance: parseFloat(user.balance) || 0
          };

          set({
            user: normalizedUser,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          return { success: true };
        } catch (error) {
          const errorMessage =
            error.response?.data?.error?.message ||
            error.response?.data?.message ||
            "Registration failed";
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // Logout
      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
        delete api.defaults.headers.common["Authorization"];
      },

      // Refresh token
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const response = await api.post("/auth/refresh", { refreshToken });
          const { token: newToken } = response.data.data;

          set({ token: newToken });
          api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      // Update user
      updateUser: (userData) => {
        set((state) => {
          // Normalize balance if it's being updated
          const normalizedData = { ...userData };
          if (normalizedData.balance !== undefined) {
            normalizedData.balance = parseFloat(normalizedData.balance) || 0;
          }
          
          return {
            user: { ...state.user, ...normalizedData },
          };
        });
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize token from storage
const token = useAuthStore.getState().token;
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export default useAuthStore;
