import { create } from 'zustand';
import type { User, Store, Currency } from '../types';

interface AuthStore {
  user: User | null;
  store: Store | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, store: Store, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  store: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, store, token) => set({ user, store, token, isAuthenticated: true }),
  logout: () => set({ user: null, store: null, token: null, isAuthenticated: false }),
}));

interface CurrencyStore {
  currencies: Currency[];
  currentCurrency: Currency | null;
  setCurrencies: (currencies: Currency[]) => void;
  setCurrentCurrency: (currency: Currency) => void;
}

export const useCurrencyStore = create<CurrencyStore>((set) => ({
  currencies: [],
  currentCurrency: null,
  setCurrencies: (currencies) => {
    const baseCurrency = currencies.find(c => c.isBase) || currencies[0];
    set({ currencies, currentCurrency: baseCurrency });
  },
  setCurrentCurrency: (currency) => set({ currentCurrency: currency }),
}));
