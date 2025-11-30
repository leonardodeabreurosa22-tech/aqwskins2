import { create } from 'zustand';

const useUIStore = create((set) => ({
  // Modal state
  modals: {
    lootBoxOpen: false,
    deposit: false,
    withdraw: false,
    exchange: false,
    fairnessVerify: false,
  },

  // Current modal data
  modalData: null,

  // Loading states
  loading: {
    global: false,
    lootbox: false,
    inventory: false,
    deposit: false,
    withdraw: false,
  },

  // Notification
  notification: null,

  // Currency & Language
  currency: localStorage.getItem('currency') || 'USD',
  language: localStorage.getItem('i18nextLng') || 'en',

  // Theme (for future dark mode)
  theme: 'dark',

  // Open modal
  openModal: (modalName, data = null) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: true },
      modalData: data,
    })),

  // Close modal
  closeModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: false },
      modalData: null,
    })),

  // Close all modals
  closeAllModals: () =>
    set({
      modals: {
        lootBoxOpen: false,
        deposit: false,
        withdraw: false,
        exchange: false,
        fairnessVerify: false,
      },
      modalData: null,
    }),

  // Set loading
  setLoading: (key, value) =>
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    })),

  // Set notification
  setNotification: (notification) => set({ notification }),

  // Clear notification
  clearNotification: () => set({ notification: null }),

  // Set currency
  setCurrency: (currency) => {
    localStorage.setItem('currency', currency);
    set({ currency });
  },

  // Set language
  setLanguage: (language) => {
    localStorage.setItem('i18nextLng', language);
    set({ language });
  },

  // Toggle theme
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),
}));

export default useUIStore;
