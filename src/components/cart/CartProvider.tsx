"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine } from "@/lib/types";

type CartContextValue = {
  lines: CartLine[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  add: (line: CartLine) => void;
  remove: (productId: string, size: string, color: string) => void;
  setQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "atelier-brode-bag-v1";

const CartContext = createContext<CartContextValue | null>(null);

function sameLine(line: CartLine, productId: string, size: string, color: string) {
  return line.productId === productId && line.size === size && line.color === color;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setLines(parsed as CartLine[]);
      }
    } catch {
      // Corrupted storage is simply ignored.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage may be unavailable in private mode.
    }
  }, [lines, hydrated]);

  const add = useCallback((line: CartLine) => {
    setLines((current) => {
      const existing = current.find((entry) => sameLine(entry, line.productId, line.size, line.color));
      if (existing) {
        return current.map((entry) =>
          sameLine(entry, line.productId, line.size, line.color)
            ? { ...entry, quantity: Math.min(10, entry.quantity + line.quantity) }
            : entry,
        );
      }
      return [...current, { ...line, quantity: Math.min(10, Math.max(1, line.quantity)) }];
    });
  }, []);

  const remove = useCallback((productId: string, size: string, color: string) => {
    setLines((current) => current.filter((entry) => !sameLine(entry, productId, size, color)));
  }, []);

  const setQuantity = useCallback((productId: string, size: string, color: string, quantity: number) => {
    setLines((current) =>
      current.map((entry) =>
        sameLine(entry, productId, size, color)
          ? { ...entry, quantity: Math.min(10, Math.max(1, quantity)) }
          : entry,
      ),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    return { lines, hydrated, count, subtotal, add, remove, setQuantity, clear };
  }, [lines, hydrated, add, remove, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
