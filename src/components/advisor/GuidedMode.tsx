"use client";

import { useState } from "react";
import type { NeedsProfile, Use } from "@/lib/recommend";
import { useStore, type ChatCard } from "../providers/StoreProvider";
import { ChatCards } from "./ChatCards";

const BUDGETS = [
  { label: "Hasta $600.000", v: 600000 },
  { label: "Hasta $900.000", v: 900000 },
  { label: "Hasta $1.300.000", v: 1300000 },
  { label: "Hasta $2.000.000", v: 2000000 },
  { label: "Sin límite", v: 0 },
];
const USES: { v: Use; label: string }[] = [
  { v: "basico", label: "Llamadas y WhatsApp" }, { v: "redes", label: "Redes sociales" }, { v: "fotos", label: "Fotos" },
  { v: "juegos", label: "Juegos" }, { v: "trabajo", label: "Trabajo / estudio" }, { v: "video", label: "Video" },
];

/** Modo guiado SIN IA: usa el mismo motor de recomendaciones con un formulario. */
export function GuidedMode({ onClose }: { onClose?: () => void }) {
  const { setProfile, profile } = useStore();
  const [budget, setBudget] = useState<number>(profile.budgetMaxCop ?? 900000);
  const [uses, setUses] = useState<Use[]>(profile.uses ?? []);
  const [battery, setBattery] = useState(false);
  const [card, setCard] = useState<ChatCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setLoading(true); setErr(null);
    const p: NeedsProfile = { budgetMaxCop: budget || null, uses, batteryImportance: battery ? 3 : undefined };
    try {
      const r = await fetch("/api/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: p }) });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setProfile({ ...profile, ...p });
      setCard({ type: "recommendations", items: d.items, note: d.note });
    } catch {
      setErr("No pudimos calcular las recomendaciones. Intenta de nuevo.");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display font-medium">Modo guiado</p>
          <p className="text-xs text-muted">Sin inteligencia artificial: recomendaciones calculadas con reglas sobre el catálogo.</p>
        </div>
        {onClose && <button onClick={onClose} className="text-xs font-semibold text-electric-600">Volver al chat</button>}
      </div>
      <fieldset>
        <legend className="label">¿Cuál es tu presupuesto?</legend>
        <div className="flex flex-wrap gap-1.5">
          {BUDGETS.map((b) => <button key={b.v} type="button" onClick={() => setBudget(b.v)} aria-pressed={budget === b.v} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${budget === b.v ? "border-electric-500 bg-electric-500 text-white" : "border-line"}`}>{b.label}</button>)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">¿Para qué lo vas a usar?</legend>
        <div className="flex flex-wrap gap-1.5">
          {USES.map((u) => {
            const on = uses.includes(u.v);
            return <button key={u.v} type="button" aria-pressed={on} onClick={() => setUses(on ? uses.filter((x) => x !== u.v) : [...uses, u.v])} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${on ? "border-electric-500 bg-electric-500 text-white" : "border-line"}`}>{u.label}</button>;
          })}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={battery} onChange={(e) => setBattery(e.target.checked)} className="h-4 w-4 accent-electric-500" /> La batería es lo más importante para mí</label>
      <button onClick={submit} disabled={loading} className="btn-primary w-full">{loading ? "Calculando…" : "Ver recomendaciones"}</button>
      {err && <p role="alert" className="text-sm text-rose-600">{err}</p>}
      {card && <ChatCards cards={[card]} />}
    </div>
  );
}
