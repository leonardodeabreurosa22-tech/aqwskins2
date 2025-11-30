import api from './api';

const userService = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/users/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Get user statistics
  getStatistics: async () => {
    const response = await api.get('/users/statistics');
    return response.data;
  },

  // Get transaction history
  getTransactionHistory: async (type = 'all', page = 1, limit = 20) => {
    const response = await api.get('/users/transactions', {
      params: { type, page, limit },
    });
    return response.data;
  },

  // Get loot box opening history
  getOpeningHistory: async (page = 1, limit = 20) => {
    const response = await api.get('/users/openings', {
      params: { page, limit },
    });
    return response.data;
  },

  // Update preferences
  updatePreferences: async (preferences) => {
    const response = await api.put('/users/preferences', preferences);
    return response.data;
  },

  // Sell item back for credits
  sellItemForCredits: async (inventoryItemId) => {
    const response = await api.post('/users/sell-item', { inventoryItemId });
    return response.data;
  },
};

export default userService;
