"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/db/schema";
import { IconCart, IconCompare } from "./Icons";
import { useStore } from "./providers/StoreProvider";

export function ProductActions({ p }: { p: Product }) {
  const { addToCart, toggleCompare, compare } = useStore();
  const [qty, setQty] = useState(1);
  const max = Math.max(1, Math.min(5, p.stock));
  const isPhone = p.categoryId === "celulares";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-xl border border-line bg-white">
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-3 text-lg" aria-label="Disminuir cantidad">−</button>
        <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
        <button onClick={() => setQty((q) => Math.min(max, q + 1))} className="px-4 py-3 text-lg" aria-label="Aumentar cantidad">+</button>
      </div>
      <button onClick={() => addToCart(p, qty)} disabled={p.stock <= 0} className="btn-primary flex-1 py-3.5"><IconCart size={18} />{p.stock > 0 ? "Agregar al carrito" : "Agotado"}</button>
      {isPhone && (
        <button onClick={() => toggleCompare(p.id)} className={`btn-outline py-3.5 ${compare.includes(p.id) ? "border-electric-500 text-electric-600" : ""}`} aria-pressed={compare.includes(p.id)}>
          <IconCompare size={18} />{compare.includes(p.id) ? "En comparador" : "Comparar"}
        </button>
      )}
      {isPhone && compare.length > 0 && <Link href="/comparar" className="text-sm font-semibold text-electric-600 hover:underline">Ver comparador ({compare.length})</Link>}
    </div>
  );
}
