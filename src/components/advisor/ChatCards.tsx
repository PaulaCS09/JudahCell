"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/db/schema";
import { formatCOP, productName, storageLabel } from "@/lib/format";
import { ROLE_LABEL, type Role } from "@/lib/recommend";
import { DemoBadge } from "../Brand";
import { IconCart, IconCheck, IconCompare, IconInfo } from "../Icons";
import { useStore, type ChatCard } from "../providers/StoreProvider";

const ROLE_STYLE: Record<Role, string> = {
  mejor_opcion: "bg-electric-500 text-white",
  alternativa_economica: "bg-emerald-100 text-emerald-800",
  mayores_prestaciones: "bg-navy-900 text-brand-cyan",
};

function Specs({ p }: { p: Product }) {
  if (p.categoryId !== "celulares") return null;
  return (
    <p className="text-xs text-muted">
      {[storageLabel(p.storageGb), p.ramGb && `${p.ramGb} GB RAM`, p.mainCameraMp && `${p.mainCameraMp} MP`, p.batteryMah && `${p.batteryMah} mAh`, p.has5g && "5G"].filter(Boolean).join(" · ")}
    </p>
  );
}

export function RecommendationCard({ item, onAskAccessories }: {
  item: { product: Product; role?: Role; reasons: string[]; limitations: string[]; overBudget: boolean };
  onAskAccessories?: (p: Product) => void;
}) {
  const { addToCart, toggleCompare, compare } = useStore();
  const p = item.product;
  return (
    <div className="card overflow-hidden">
      {item.role && <div className={`px-3 py-1.5 text-xs font-semibold ${ROLE_STYLE[item.role]}`}>{ROLE_LABEL[item.role]}</div>}
      <div className="flex gap-3 p-3">
        <Link href={`/producto/${p.id}`} className="shrink-0">
          <Image src={p.image} alt={productName(p)} width={88} height={88} className="h-20 w-20 rounded-xl bg-white object-contain" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/producto/${p.id}`} className="font-display leading-tight font-medium text-ink hover:text-electric-600">{productName(p)}</Link>
            {p.isDemo && <DemoBadge />}
          </div>
          <p className="mt-0.5 font-bold text-ink">{formatCOP(p.priceCop)} {item.overBudget && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">Supera tu presupuesto</span>}</p>
          <Specs p={p} />
        </div>
      </div>
      <div className="space-y-1 px-3 pb-2 text-[13px]">
        {item.reasons.slice(0, 3).map((r) => <p key={r} className="flex gap-1.5 text-ink"><IconCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />{r}</p>)}
        {item.limitations.slice(0, 2).map((r) => <p key={r} className="flex gap-1.5 text-muted"><IconInfo size={15} className="mt-0.5 shrink-0 text-amber-600" />{r}</p>)}
      </div>
      <div className="flex flex-wrap gap-1.5 border-t border-line p-2.5">
        <button onClick={() => addToCart(p)} disabled={p.stock <= 0} className="inline-flex items-center gap-1.5 rounded-lg bg-electric-500 px-3 py-2 text-xs font-semibold text-white hover:bg-electric-600 disabled:opacity-40"><IconCart size={15} />Agregar</button>
        <button onClick={() => toggleCompare(p.id)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${compare.includes(p.id) ? "border-electric-500 text-electric-600" : "border-line text-ink hover:border-electric-400"}`}><IconCompare size={15} />{compare.includes(p.id) ? "En comparador" : "Comparar"}</button>
        {onAskAccessories && <button onClick={() => onAskAccessories(p)} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:border-electric-400">Accesorios</button>}
      </div>
    </div>
  );
}

function MiniProduct({ p, note }: { p: Product; note?: string | null }) {
  const { addToCart } = useStore();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-2.5">
      <Image src={p.image} alt="" width={56} height={56} className="h-14 w-14 rounded-lg object-contain" />
      <div className="min-w-0 flex-1">
        <Link href={`/producto/${p.id}`} className="block truncate text-sm font-medium text-ink hover:text-electric-600">{productName(p)}</Link>
        <p className="text-sm font-bold">{formatCOP(p.priceCop)}</p>
        {note && <p className="text-[11px] leading-tight text-muted">{note}</p>}
        <Specs p={p} />
      </div>
      <button onClick={() => addToCart(p)} disabled={p.stock <= 0} aria-label={`Agregar ${productName(p)}`} className="rounded-lg bg-electric-500 p-2 text-white hover:bg-electric-600 disabled:opacity-40"><IconCart size={16} /></button>
    </div>
  );
}

export function ChatCards({ cards, onAskAccessories }: { cards: ChatCard[]; onAskAccessories?: (p: Product) => void }) {
  return (
    <div className="space-y-3">
      {cards.map((c, i) => {
        if (c.type === "recommendations")
          return (
            <div key={i} className="space-y-2.5">
              {c.note && <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">{c.note}</p>}
              <div className="grid gap-2.5 xl:grid-cols-2">
                {c.items.map((it) => <RecommendationCard key={it.product.id} item={it} onAskAccessories={onAskAccessories} />)}
              </div>
            </div>
          );
        if (c.type === "accessories")
          return (
            <div key={i} className="space-y-2">
              <p className="text-xs font-semibold text-muted">Accesorios con compatibilidad verificada para {c.phoneName} · Tú decides si los necesitas</p>
              <div className="grid gap-2 sm:grid-cols-2">{c.items.map((p) => <MiniProduct key={p.id} p={p} note={p.compatNote} />)}</div>
            </div>
          );
        return <div key={i} className="grid gap-2 sm:grid-cols-2">{c.items.map((p) => <MiniProduct key={p.id} p={p} />)}</div>;
      })}
    </div>
  );
}
