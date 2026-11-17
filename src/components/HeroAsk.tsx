"use client";

import Link from "next/link";
import { useState } from "react";
import { IconArrowRight, IconChat } from "./Icons";
import { useStore } from "./providers/StoreProvider";

export function HeroActions() {
  const { openAdvisor } = useStore();
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button onClick={() => openAdvisor()} className="btn-cyan px-6 py-3.5 text-base"><IconChat size={20} />Encontrar mi celular</button>
      <Link href="/catalogo" className="btn-ghost px-6 py-3.5 text-base">Explorar productos <IconArrowRight size={18} /></Link>
    </div>
  );
}

export function HeroAsk() {
  const { openAdvisor } = useStore();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (q.trim()) openAdvisor(q.trim()); else openAdvisor(); }}
      className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[.06] p-2 backdrop-blur"
    >
      <label htmlFor="hero-ask" className="sr-only">Cuéntale al asesor qué buscas</label>
      <input id="hero-ask" value={q} onChange={(e) => setQ(e.target.value.slice(0, 300))} placeholder="Ej: uno con buena cámara por menos de 1 millón" className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/45 focus:outline-none" />
      <button className="rounded-xl bg-electric-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-electric-600">Preguntar</button>
    </form>
  );
}

export function AskAdvisorButton({ prompt, label, className }: { prompt?: string; label: string; className?: string }) {
  const { openAdvisor } = useStore();
  return <button onClick={() => openAdvisor(prompt)} className={className ?? "btn-primary"}><IconChat size={18} />{label}</button>;
}
