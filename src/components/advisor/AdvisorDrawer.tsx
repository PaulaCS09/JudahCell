"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AdvisorAvatar } from "../Brand";
import { IconX } from "../Icons";
import { useStore } from "../providers/StoreProvider";
import { AdvisorChat } from "./AdvisorChat";
import { ProfileSummary } from "./ProfileSummary";

/** Panel lateral del asesor disponible en todas las secciones + lanzador visible. */
export function AdvisorDrawer() {
  const { advisorOpen, openAdvisor, closeAdvisor, profile, chat } = useStore();
  const pathname = usePathname();
  const onAdvisorPage = pathname.startsWith("/asesor");

  useEffect(() => {
    if (!advisorOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAdvisor();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advisorOpen, closeAdvisor]);

  useEffect(() => { if (onAdvisorPage) closeAdvisor(); }, [onAdvisorPage, closeAdvisor]);

  if (onAdvisorPage) return null;

  return (
    <>
      {!advisorOpen && (
        <button
          onClick={() => openAdvisor()}
          className="fixed right-4 bottom-4 z-40 flex items-center gap-3 rounded-2xl border border-brand-cyan/30 bg-navy-900 py-2 pr-4 pl-2 sm:pr-5 text-left text-white shadow-[0_18px_50px_-12px_rgba(4,10,28,.7)] transition hover:-translate-y-0.5 hover:border-brand-cyan sm:right-6 sm:bottom-6"
          aria-label="Abrir el Asesor JUDAH"
        >
          <AdvisorAvatar size={44} />
          <span className="leading-tight">
            <span className="block text-sm font-semibold">Asesor JUDAH</span>
            <span className="hidden text-xs text-brand-cyan sm:block">{chat.length ? "Continuar conversación" : "¿Te ayudo a elegir?"}</span>
          </span>
        </button>
      )}

      {advisorOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Asesor JUDAH">
          <button className="absolute inset-0 bg-navy-950/50 backdrop-blur-[2px]" onClick={closeAdvisor} aria-label="Cerrar asesor" />
          <aside className="absolute inset-y-0 right-0 flex w-full flex-col bg-surface shadow-2xl sm:max-w-[460px]">
            <div className="hero-glow flex items-center gap-3 px-4 py-4 text-white">
              <AdvisorAvatar size={44} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg leading-tight">Asesor JUDAH</p>
                <p className="text-xs text-white/65">Te ayudo a elegir, sin presiones · 24/7</p>
              </div>
              <Link href="/asesor" className="hidden rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-cyan hover:bg-white/10 sm:block">Pantalla completa</Link>
              <button onClick={closeAdvisor} className="rounded-lg p-2 hover:bg-white/10" aria-label="Cerrar"><IconX size={20} /></button>
            </div>
            <details className="border-b border-line bg-white px-4 py-2.5 text-sm">
              <summary className="cursor-pointer text-xs font-semibold text-muted">Lo que entendí de ti</summary>
              <div className="pt-2"><ProfileSummary profile={profile} /></div>
            </details>
            <div className="min-h-0 flex-1"><AdvisorChat variant="drawer" /></div>
          </aside>
        </div>
      )}
    </>
  );
}
