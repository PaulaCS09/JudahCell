"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/db/schema";
import type { NeedsProfile, Role } from "@/lib/recommend";

export type CartLine = { id: string; quantity: number; name: string; priceCop: number; image: string; categoryId: string; isDemo: boolean };

export type ChatCard =
  | { type: "recommendations"; items: { product: Product; role?: Role; reasons: string[]; limitations: string[]; overBudget: boolean }[]; note?: string }
  | { type: "accessories"; phoneId: string; phoneName: string; items: (Product & { compatNote: string | null })[] }
  | { type: "products"; items: Product[] };

export type ChatMessage = { id: string; role: "user" | "assistant"; text: string; cards?: ChatCard[]; error?: boolean };

type Toast = { id: number; text: string };

type Store = {
  cart: CartLine[];
  addToCart: (p: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  syncCartPrices: (products: Product[]) => void;
  cartCount: number;
  compare: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  // Asesor
  chat: ChatMessage[];
  setChat: (fn: (prev: ChatMessage[]) => ChatMessage[]) => void;
  profile: NeedsProfile;
  setProfile: (p: NeedsProfile) => void;
  resetAdvisor: () => void;
  advisorOpen: boolean;
  openAdvisor: (prefill?: string) => void;
  closeAdvisor: () => void;
  pendingPrompt: string | null;
  consumePendingPrompt: () => string | null;
  toasts: Toast[];
  toast: (text: string) => void;
};

const Ctx = createContext<Store | null>(null);

function load<T>(storage: "local" | "session", key: string, fallback: T): T {
  try {
    const s = storage === "local" ? window.localStorage : window.sessionStorage;
    const v = s.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(storage: "local" | "session", key: string, value: unknown) {
  try {
    (storage === "local" ? window.localStorage : window.sessionStorage).setItem(key, JSON.stringify(value));
  } catch {}
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [chat, setChatState] = useState<ChatMessage[]>([]);
  const [profile, setProfile] = useState<NeedsProfile>({});
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCart(load("local", "jc_cart", []));
    setCompare(load("local", "jc_compare", []));
    setChatState(load("session", "jc_chat", []));
    setProfile(load("session", "jc_profile", {}));
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) save("local", "jc_cart", cart); }, [cart, loaded]);
  useEffect(() => { if (loaded) save("local", "jc_compare", compare); }, [compare, loaded]);
  useEffect(() => { if (loaded) save("session", "jc_chat", chat.slice(-40)); }, [chat, loaded]);
  useEffect(() => { if (loaded) save("session", "jc_profile", profile); }, [profile, loaded]);

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const addToCart = useCallback((p: Product, qty = 1) => {
    if (p.stock <= 0) return toast("Este producto no tiene unidades disponibles");
    setCart((c) => {
      const ex = c.find((l) => l.id === p.id);
      if (ex) return c.map((l) => (l.id === p.id ? { ...l, quantity: Math.min(l.quantity + qty, Math.min(5, p.stock)) } : l));
      const name = p.brand.startsWith("Genérico") ? p.model : `${p.brand} ${p.model}`;
      return [...c, { id: p.id, quantity: qty, name, priceCop: p.priceCop, image: p.image, categoryId: p.categoryId, isDemo: p.isDemo }];
    });
    toast(`Agregado al carrito: ${p.brand.startsWith("Genérico") ? p.model : `${p.brand} ${p.model}`}`);
  }, [toast]);

  const value = useMemo<Store>(() => ({
    cart,
    addToCart,
    setQty: (id, qty) => setCart((c) => c.map((l) => (l.id === id ? { ...l, quantity: Math.max(1, Math.min(5, qty)) } : l))),
    removeFromCart: (id) => setCart((c) => c.filter((l) => l.id !== id)),
    clearCart: () => setCart([]),
    syncCartPrices: (products) =>
      setCart((c) => c.filter((l) => products.some((p) => p.id === l.id)).map((l) => {
        const p = products.find((x) => x.id === l.id)!;
        return { ...l, priceCop: p.priceCop, quantity: Math.min(l.quantity, Math.max(1, Math.min(5, p.stock))) };
      })),
    cartCount: cart.reduce((s, l) => s + l.quantity, 0),
    compare,
    toggleCompare: (id) =>
      setCompare((c) => {
        if (c.includes(id)) return c.filter((x) => x !== id);
        if (c.length >= 3) { toast("Puedes comparar hasta 3 celulares"); return c; }
        toast("Agregado al comparador");
        return [...c, id];
      }),
    clearCompare: () => setCompare([]),
    chat,
    setChat: (fn) => setChatState(fn),
    profile,
    setProfile,
    resetAdvisor: () => { setChatState([]); setProfile({}); },
    advisorOpen,
    openAdvisor: (prefill) => { if (prefill) setPendingPrompt(prefill); setAdvisorOpen(true); },
    closeAdvisor: () => setAdvisorOpen(false),
    pendingPrompt,
    consumePendingPrompt: () => { const p = pendingPrompt; setPendingPrompt(null); return p; },
    toasts,
    toast,
  }), [cart, addToCart, compare, chat, profile, advisorOpen, pendingPrompt, toasts, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore debe usarse dentro de StoreProvider");
  return s;
}
