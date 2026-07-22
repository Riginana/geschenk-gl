import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPriceCents: number;
  qty: number;
  personalization: {
    names?: string;
    date?: string;
    message?: string;
    format: string;
    material: string;
  };
};

type Ctx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  update: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotalCents: number;
};

const CartContext = createContext<Ctx | null>(null);

const STORAGE = "cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(items));
    } catch {}
  }, [items]);

  const add: Ctx["add"] = (item) =>
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing)
        return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + item.qty } : p));
      return [...prev, item];
    });

  const remove = (id: string) => setItems((p) => p.filter((i) => i.id !== id));
  const update = (id: string, qty: number) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotalCents = items.reduce((s, i) => s + i.qty * i.unitPriceCents, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, update, clear, count, subtotalCents }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
