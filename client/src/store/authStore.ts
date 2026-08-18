import { create } from 'zustand';
import type { User, Store, Currency } from '../types';
import { authService, currencyService } from '../services';

interface AuthStore {
  user: User | null;
  store: Store | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setAuth: (user: User, store: Store, token: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  store: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  setAuth: (user, store, token) => set({ user, store, token, isAuthenticated: true, isLoading: false }),
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    const response = await authService.login(email, password);
    set({ isLoading: false });
    
    if (response.success && response.data) {
      set({ user: response.data.user, store: response.data.store, token: response.data.token, isAuthenticated: true });
      // Load currencies
      const currencies = await currencyService.getAll();
      useCurrencyStore.getState().setCurrencies(currencies);
      return true;
    } else {
      set({ error: response.error || 'Login failed' });
      return false;
    }
  },
  logout: async () => {
    await authService.logout();
    set({ user: null, store: null, token: null, isAuthenticated: false });
    useCurrencyStore.getState().setCurrencies([]);
  },
  checkAuth: async () => {
    set({ isLoading: true });
    const user = await authService.getCurrentUser();
    const store = await authService.getCurrentStore();
    const token = await authService.getAuthToken();
    
    if (user && store && token) {
      set({ user, store, token, isAuthenticated: true, isLoading: false });
      const currencies = await currencyService.getAll();
      useCurrencyStore.getState().setCurrencies(currencies);
    } else {
      set({ isLoading: false });
    }
  },
}));

interface CurrencyStore {
  currencies: Currency[];
  currentCurrency: Currency | null;
  isOnline: boolean;
  setCurrencies: (currencies: Currency[]) => void;
  setCurrentCurrency: (currency: Currency) => void;
  setOnline: (online: boolean) => void;
}

export const useCurrencyStore = create<CurrencyStore>((set) => ({
  currencies: [],
  currentCurrency: null,
  isOnline: navigator.onLine,
  setCurrencies: (currencies) => {
    const baseCurrency = currencies.find(c => c.isBase) || currencies[0];
    set({ currencies, currentCurrency: baseCurrency });
  },
  setCurrentCurrency: (currency) => set({ currentCurrency: currency }),
  setOnline: (online) => set({ isOnline: online }),
}));

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useCurrencyStore.getState().setOnline(true));
  window.addEventListener('offline', () => useCurrencyStore.getState().setOnline(false));
}
