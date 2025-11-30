import api from "./api";

const lootboxService = {
  // Get all loot boxes
  getAll: async () => {
    const response = await api.get("/lootboxes");
    return response.data;
  },

  // Get loot box by ID
  getById: async (id) => {
    const response = await api.get(`/lootboxes/${id}`);
    return response.data;
  },

  // Get loot box items
  getItems: async (id) => {
    const response = await api.get(`/lootboxes/${id}/items`);
    return response.data;
  },

  // Open loot box
  open: async (lootboxId, quantity = 1) => {
    const response = await api.post(`/lootboxes/${lootboxId}/open`, {
      quantity,
    });
    return response.data;
  },

  // Get opening history
  getHistory: async (page = 1, limit = 20) => {
    const response = await api.get("/lootboxes/history", {
      params: { page, limit },
    });
    return response.data;
  },

  // Verify fairness
  verifyFairness: async (openingId) => {
    const response = await api.post("/fairness/verify", {
      openingId,
    });
    return response.data;
  },

  // Get live drops (recent openings)
  getLiveDrops: async (limit = 50) => {
    const response = await api.get("/lootboxes/live-drops", {
      params: { limit },
    });
    return response.data;
  },

  // Use coupon code
  useCoupon: async (code) => {
    const response = await api.post("/coupons/use", { code });
    return response.data;
  },
};

export default lootboxService;
