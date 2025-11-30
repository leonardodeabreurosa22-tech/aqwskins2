import api from './api';

const adminService = {
  // Dashboard Statistics
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  // User Management
  getUsers: async (page = 1, limit = 20, filters = {}) => {
    const response = await api.get('/admin/users', {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  banUser: async (userId, reason) => {
    const response = await api.post(`/admin/users/${userId}/ban`, { reason });
    return response.data;
  },

  unbanUser: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/unban`);
    return response.data;
  },

  changeUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Loot Box Management
  getLootBoxes: async () => {
    const response = await api.get('/admin/lootboxes');
    return response.data;
  },

  createLootBox: async (data) => {
    const response = await api.post('/admin/lootboxes', data);
    return response.data;
  },

  updateLootBox: async (id, data) => {
    const response = await api.put(`/admin/lootboxes/${id}`, data);
    return response.data;
  },

  deleteLootBox: async (id) => {
    const response = await api.delete(`/admin/lootboxes/${id}`);
    return response.data;
  },

  // Item Management
  getItems: async (page = 1, limit = 50) => {
    const response = await api.get('/admin/items', {
      params: { page, limit },
    });
    return response.data;
  },

  createItem: async (data) => {
    const response = await api.post('/admin/items', data);
    return response.data;
  },

  updateItem: async (id, data) => {
    const response = await api.put(`/admin/items/${id}`, data);
    return response.data;
  },

  deleteItem: async (id) => {
    const response = await api.delete(`/admin/items/${id}`);
    return response.data;
  },

  addItemCodes: async (itemId, codes) => {
    const response = await api.post(`/admin/items/${itemId}/codes`, { codes });
    return response.data;
  },

  // Withdrawal Management
  getPendingWithdrawals: async () => {
    const response = await api.get('/admin/withdrawals/pending');
    return response.data;
  },

  approveWithdrawal: async (withdrawalId, itemCode) => {
    const response = await api.post(`/admin/withdrawals/${withdrawalId}/approve`, { itemCode });
    return response.data;
  },

  rejectWithdrawal: async (withdrawalId, reason) => {
    const response = await api.post(`/admin/withdrawals/${withdrawalId}/reject`, { reason });
    return response.data;
  },

  // Coupon Management
  getCoupons: async () => {
    const response = await api.get('/admin/coupons');
    return response.data;
  },

  createCoupon: async (data) => {
    const response = await api.post('/admin/coupons', data);
    return response.data;
  },

  deactivateCoupon: async (id) => {
    const response = await api.put(`/admin/coupons/${id}/deactivate`);
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (page = 1, limit = 50, filters = {}) => {
    const response = await api.get('/admin/audit-logs', {
      params: { page, limit, ...filters },
    });
    return response.data;
  },
};

export default adminService;
