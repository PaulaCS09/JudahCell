"use client";

import Link from "next/link";
import { AdvisorAvatar } from "../Brand";
import { IconCart, IconCompare, IconShield } from "../Icons";
import { useStore } from "../providers/StoreProvider";
import { AdvisorChat } from "./AdvisorChat";
import { ProfileSummary } from "./ProfileSummary";

export function AdvisorPage() {
  const { profile, cartCount, compare } = useStore();
  return (
    <div className="hero-glow relative">
      <div className="hex-pattern absolute inset-0" aria-hidden />
      <div className="container-x relative grid gap-6 py-6 sm:py-10 lg:grid-cols-[300px_1fr]">
        <aside className="order-2 space-y-4 lg:order-1">
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5 text-white">
            <div className="flex items-center gap-3">
              <AdvisorAvatar size={48} />
              <div><h1 className="font-display text-xl">Asesor JUDAH</h1><p className="text-xs text-white/60">Asesoría personalizada 24/7</p></div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">Te escucho, consulto el catálogo y te recomiendo opciones explicadas. Nunca invento precios ni te presiono.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
            <h2 className="mb-3 text-sm font-semibold text-white">Lo que entendí de ti</h2>
            <ProfileSummary profile={profile} dark />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <Link href="/comparar" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] p-3 text-sm text-white hover:bg-white/10"><IconCompare size={18} className="text-brand-cyan" />Comparador ({compare.length})</Link>
            <Link href="/carrito" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] p-3 text-sm text-white hover:bg-white/10"><IconCart size={18} className="text-brand-cyan" />Carrito ({cartCount})</Link>
          </div>
          <p className="flex gap-2 text-xs text-white/50"><IconShield size={16} className="shrink-0" />No compartas contraseñas ni datos bancarios en el chat. La conversación se guarda solo en esta pestaña del navegador.</p>
        </aside>
        <section className="order-1 flex h-[calc(100dvh-170px)] min-h-[520px] flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl lg:order-2 lg:h-[calc(100dvh-190px)]" aria-label="Conversación con el Asesor JUDAH">
          <AdvisorChat variant="page" />
        </section>
      </div>
    </div>
  );
}
