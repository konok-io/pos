import { create } from 'zustand';
import type { CartItem, Product } from '../types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, change: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => { subtotal: number; discount: number; vat: number; total: number };
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (product) => {
    const items = get().items;
    const existing = items.find(item => item.productId === product.id);

    if (existing) {
      if (existing.quantity >= product.stock) {
        return;
      }
      set({
        items: items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitPrice: product.sellPrice,
            total: product.sellPrice,
            product,
          },
        ],
      });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter(item => item.productId !== productId) });
  },

  updateQuantity: (productId, change) => {
    const items = get().items;
    const item = items.find(i => i.productId === productId);
    if (!item) return;

    const product = item.product;
    if (!product) return;

    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
      get().removeItem(productId);
    } else if (newQuantity > product.stock) {
      // Already at max
    } else {
      set({
        items: items.map(i =>
          i.productId === productId
            ? { ...i, quantity: newQuantity, total: newQuantity * i.unitPrice }
            : i
        ),
      });
    }
  },

  clearCart: () => set({ items: [] }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.total, 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = 0;
    const vat = Math.round(subtotal * 0.05);
    const total = subtotal - discount + vat;
    return { subtotal, discount, vat, total };
  },
}));
