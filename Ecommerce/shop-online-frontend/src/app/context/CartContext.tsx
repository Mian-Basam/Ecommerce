// app/context/CartContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "react-toastify";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type CartContextType = {
  cartItems: CartItem[];
  /** Adds `quantity` (defaults to item.quantity, then 1) of the item. */
  addToCart: (item: CartItem, quantity?: number) => void;
  /** Sets an item's quantity; 0 or less removes it. */
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  /** Empties the cart. Pass { silent: true } to skip the toast (e.g. after checkout). */
  clearCart: (options?: { silent?: boolean }) => void;
  cartCount: number;
  subtotal: number;
};

const STORAGE_KEY = "cart";

const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  cartCount: 0,
  subtotal: 0,
});

export const useCart = () => useContext(CartContext);

const loadCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((i) => i && typeof i.id === "string" && i.quantity > 0)
      : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Restore the saved cart after mount (localStorage isn't available during SSR).
  useEffect(() => {
    setCartItems(loadCart());
    setHydrated(true);
  }, []);

  // Save on every change - but not before the saved cart has been restored.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      /* storage full or blocked - cart still works for this session */
    }
  }, [cartItems, hydrated]);

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCartItems(loadCart());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addToCart = (newItem: CartItem, quantity?: number) => {
    const qty = Math.max(1, quantity ?? newItem.quantity ?? 1);
    const exists = cartItems.some((item) => item.id === newItem.id);

    setCartItems((prev) =>
      prev.some((item) => item.id === newItem.id)
        ? prev.map((item) =>
            item.id === newItem.id ? { ...item, quantity: item.quantity + qty } : item
          )
        : [...prev, { ...newItem, quantity: qty }]
    );

    if (exists) toast.info(`Updated quantity for ${newItem.name}`);
    else toast.success(`Added ${qty > 1 ? `${qty} × ` : ""}${newItem.name} to cart`);
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems((prev) =>
      quantity <= 0
        ? prev.filter((item) => item.id !== id)
        : prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (id: string) => {
    const removedItem = cartItems.find((item) => item.id === id);
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    if (removedItem) toast.error(`Removed ${removedItem.name} from cart`);
  };

  const clearCart = (options?: { silent?: boolean }) => {
    setCartItems([]);
    if (!options?.silent) toast.warn("Cart cleared");
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
