import api from "./api";

const exchangerService = {
  // Get available items for exchange
  getAvailableItems: async () => {
    const response = await api.get("/exchanger/items");
    return response.data;
  },

  // Calculate exchange value
  calculateExchange: async (sourceItemIds, targetItemId) => {
    const response = await api.post("/exchanger/calculate", {
      sourceItemIds,
      targetItemId,
    });
    return response.data;
  },

  // Execute exchange
  executeExchange: async (sourceItemIds, targetItemId) => {
    const response = await api.post("/exchanger/exchange", {
      sourceItemIds,
      targetItemId,
    });
    return response.data;
  },

  // Get exchange history
  getExchangeHistory: async (page = 1, limit = 20) => {
    const response = await api.get("/exchanger/history", {
      params: { page, limit },
    });
    return response.data;
  },
};

export default exchangerService;
