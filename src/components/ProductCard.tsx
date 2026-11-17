"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/db/schema";
import { formatCOP, productName, storageLabel } from "@/lib/format";
import { DemoBadge } from "./Brand";
import { IconBattery, IconCamera, IconCart, IconCompare, IconStorage } from "./Icons";
import { useStore } from "./providers/StoreProvider";

export function StockLabel({ stock }: { stock: number }) {
  if (stock <= 0) return <span className="text-xs font-medium text-rose-600">Agotado</span>;
  if (stock <= 3) return <span className="text-xs font-medium text-amber-700">Últimas {stock} unidades</span>;
  return <span className="text-xs font-medium text-emerald-700">Disponible</span>;
}

export function ProductCard({ p, compact = false }: { p: Product; compact?: boolean }) {
  const { addToCart, toggleCompare, compare } = useStore();
  const isPhone = p.categoryId === "celulares";
  const inCompare = compare.includes(p.id);

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-electric-400/40 hover:shadow-[0_18px_40px_-20px_rgba(12,31,74,.35)]">
      <Link href={`/producto/${p.id}`} className="relative block bg-white">
        <Image src={p.image} alt={productName(p)} width={400} height={400} className={`mx-auto aspect-square w-full object-contain ${compact ? "p-3" : "p-5"} transition group-hover:scale-[1.03]`} />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {p.isDemo && <DemoBadge />}
          {p.has5g && <span className="rounded-md bg-navy-900 px-2 py-0.5 text-[11px] font-semibold text-brand-cyan">5G</span>}
        </div>
        {p.imageIsIllustration && <span className="absolute right-3 bottom-2 text-[10px] text-muted">Imagen ilustrativa</span>}
      </Link>

      <div className="flex flex-1 flex-col gap-3 border-t border-line p-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-electric-600 uppercase">{p.brand.startsWith("Genérico") ? "Accesorio" : p.brand}</p>
          <h3 className="font-display text-base leading-snug font-medium text-ink">
            <Link href={`/producto/${p.id}`} className="hover:text-electric-600">{p.brand.startsWith("Genérico") ? p.model : p.model}</Link>
          </h3>
        </div>

        {isPhone && !compact && (
          <ul className="grid grid-cols-3 gap-1.5 text-[11px] text-muted">
            <li className="flex flex-col items-center gap-1 rounded-lg bg-surface px-1 py-2 text-center"><IconStorage size={16} className="text-electric-500" />{storageLabel(p.storageGb)}{p.ramGb ? ` · ${p.ramGb} GB RAM` : ""}</li>
            <li className="flex flex-col items-center gap-1 rounded-lg bg-surface px-1 py-2 text-center"><IconCamera size={16} className="text-electric-500" />{p.mainCameraMp} MP</li>
            <li className="flex flex-col items-center gap-1 rounded-lg bg-surface px-1 py-2 text-center"><IconBattery size={16} className="text-electric-500" />{p.batteryMah ? `${p.batteryMah} mAh` : "Todo el día"}</li>
          </ul>
        )}
        {!isPhone && !compact && <p className="line-clamp-2 text-sm text-muted">{p.description}</p>}

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-bold text-ink">{formatCOP(p.priceCop)}</p>
            <StockLabel stock={p.stock} />
          </div>
          <div className="flex gap-1.5">
            {isPhone && (
              <button onClick={() => toggleCompare(p.id)} aria-pressed={inCompare} title={inCompare ? "Quitar del comparador" : "Agregar al comparador"} aria-label={inCompare ? "Quitar del comparador" : "Agregar al comparador"} className={`rounded-xl border p-2.5 transition ${inCompare ? "border-electric-500 bg-electric-500/10 text-electric-600" : "border-line text-muted hover:border-electric-400 hover:text-electric-600"}`}>
                <IconCompare size={18} />
              </button>
            )}
            <button onClick={() => addToCart(p)} disabled={p.stock <= 0} className="rounded-xl bg-electric-500 p-2.5 text-white transition hover:bg-electric-600 disabled:opacity-40" aria-label={`Agregar ${productName(p)} al carrito`} title="Agregar al carrito">
              <IconCart size={18} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
