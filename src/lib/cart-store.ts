import { create } from 'zustand';
import type { CartItem, Product } from './types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { product, quantity: 1 }] };
    });
  },
  removeItem: (productId) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === productId);
      if (existing && existing.quantity > 1) {
        return {
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
          ),
        };
      }
      return { items: state.items.filter((i) => i.product.id !== productId) };
    });
  },
  updateQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((i) => i.product.id !== productId) };
      }
      return {
        items: state.items.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        ),
      };
    });
  },
  clearCart: () => set({ items: [] }),
  getTotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
