import api from './api';

const inventoryService = {
  // Get user inventory
  getInventory: async (page = 1, limit = 50, filters = {}) => {
    const response = await api.get('/inventory', {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  // Get inventory item details
  getItem: async (itemId) => {
    const response = await api.get(`/inventory/${itemId}`);
    return response.data;
  },

  // Get inventory statistics
  getStats: async () => {
    const response = await api.get('/inventory/stats');
    return response.data;
  },

  // Request withdrawal
  requestWithdrawal: async (inventoryItemId) => {
    const response = await api.post('/withdraw/request', {
      inventoryItemId,
    });
    return response.data;
  },

  // Get withdrawal history
  getWithdrawals: async (page = 1, limit = 20) => {
    const response = await api.get('/withdraw/history', {
      params: { page, limit },
    });
    return response.data;
  },

  // Cancel pending withdrawal
  cancelWithdrawal: async (withdrawalId) => {
    const response = await api.post(`/withdraw/${withdrawalId}/cancel`);
    return response.data;
  },
};

export default inventoryService;
