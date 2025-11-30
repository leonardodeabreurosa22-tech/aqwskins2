import api from "./api";

const depositService = {
  // Get supported currencies
  getCurrencies: async () => {
    const response = await api.get("/deposits/currencies");
    return response.data;
  },

  // Get payment methods
  getPaymentMethods: async () => {
    const response = await api.get("/deposits/methods");
    return response.data;
  },

  // Create Stripe checkout session
  createStripeSession: async (amount, currency) => {
    const response = await api.post("/deposits/stripe/create-session", {
      amount,
      currency,
    });
    return response.data;
  },

  // Create PayPal order
  createPayPalOrder: async (amount, currency) => {
    const response = await api.post("/deposits/paypal/create-order", {
      amount,
      currency,
    });
    return response.data;
  },

  // Generate PIX QR Code
  generatePixQRCode: async (amount) => {
    const response = await api.post("/deposits/pix/generate", {
      amount,
    });
    return response.data;
  },

  // Get deposit history
  getDepositHistory: async (page = 1, limit = 20) => {
    const response = await api.get("/deposits/history", {
      params: { page, limit },
    });
    return response.data;
  },

  // Get currency conversion rate
  getConversionRate: async (fromCurrency, toCurrency, amount) => {
    const response = await api.get("/deposits/convert", {
      params: { from: fromCurrency, to: toCurrency, amount },
    });
    return response.data;
  },
};

export default depositService;
