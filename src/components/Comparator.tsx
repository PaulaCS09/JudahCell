"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/db/schema";
import { formatCOP, PERFORMANCE_LABEL, productName, storageLabel } from "@/lib/format";
import { recommendPhones, type NeedsProfile, type Use } from "@/lib/recommend";
import { DemoBadge } from "./Brand";
import { IconCart, IconCheck, IconInfo, IconX } from "./Icons";
import { useStore } from "./providers/StoreProvider";

const PRIORITIES = [
  { id: "precio", label: "Precio bajo" },
  { id: "camara", label: "Cámara" },
  { id: "bateria", label: "Batería" },
  { id: "rendimiento", label: "Rendimiento" },
  { id: "almacenamiento", label: "Almacenamiento" },
] as const;
type Priority = (typeof PRIORITIES)[number]["id"];

function Stars({ n }: { n: number | null }) {
  if (!n) return <span className="text-muted">—</span>;
  return <span aria-label={`${n} de 5`} className="tracking-wider text-electric-500">{"●".repeat(n)}<span className="text-line">{"●".repeat(5 - n)}</span></span>;
}

export function Comparator({ phones }: { phones: Product[] }) {
  const { compare, toggleCompare, addToCart, openAdvisor } = useStore();
  const [priorities, setPriorities] = useState<Priority[]>(["bateria", "camara"]);
  const selected = compare.map((id) => phones.find((p) => p.id === id)).filter(Boolean) as Product[];
  const available = phones.filter((p) => !compare.includes(p.id));

  const conclusion = useMemo(() => {
    if (selected.length < 2) return null;
    const imp = (p: Priority) => (priorities.includes(p) ? 3 : 1);
    const profile: NeedsProfile = {
      cameraImportance: imp("camara"),
      batteryImportance: imp("bateria"),
      performanceImportance: imp("rendimiento"),
      storageMinGb: priorities.includes("almacenamiento") ? 256 : null,
      uses: priorities.includes("precio") ? (["basico"] as Use[]) : [],
    };
    const all = recommendPhones(selected, profile, Infinity);
    // Ordenar todos los seleccionados por puntaje para la conclusión
    return all;
  }, [selected, priorities]);

  const best = conclusion?.results.find((r) => r.role === "mejor_opcion") ?? conclusion?.results[0];

  const rows: { label: string; render: (p: Product) => React.ReactNode }[] = [
    { label: "Precio", render: (p) => <strong>{formatCOP(p.priceCop)}</strong> },
    { label: "Marca", render: (p) => p.brand },
    { label: "Modelo", render: (p) => p.model },
    { label: "Cámara", render: (p) => <div className="space-y-1"><Stars n={p.cameraScore} /><p className="text-xs text-muted">{p.cameraSummary}</p></div> },
    { label: "Batería", render: (p) => <div className="space-y-1"><Stars n={p.batteryScore} /><p className="text-xs text-muted">{p.batteryMah ? `${p.batteryMah} mAh` : "No publicada en mAh"}</p></div> },
    { label: "Almacenamiento", render: (p) => storageLabel(p.storageGb) },
    { label: "Memoria RAM", render: (p) => (p.ramGb ? `${p.ramGb} GB` : "—") },
    { label: "Rendimiento", render: (p) => <div className="space-y-1"><Stars n={p.performanceScore} /><p className="text-xs text-muted">{p.performanceScore ? PERFORMANCE_LABEL[p.performanceScore] : ""} · {p.processor}</p></div> },
    { label: "Pantalla", render: (p) => p.screen },
    { label: "5G", render: (p) => (p.has5g ? "Sí" : "No") },
    { label: "Diferenciales", render: (p) => <ul className="space-y-0.5 text-xs">{p.highlights.map((h) => <li key={h}>• {h}</li>)}</ul> },
  ];

  return (
    <div className="mt-8 space-y-8">
      <div className="card p-5">
        <p className="label">¿Qué es lo más importante para ti?</p>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((pr) => {
            const on = priorities.includes(pr.id);
            return <button key={pr.id} aria-pressed={on} onClick={() => setPriorities(on ? priorities.filter((x) => x !== pr.id) : [...priorities, pr.id])} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${on ? "border-electric-500 bg-electric-500 text-white" : "border-line bg-white hover:border-electric-400"}`}>{pr.label}</button>;
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">Comparación de celulares seleccionados</caption>
          <thead>
            <tr>
              <th className="w-40 p-4 text-left align-bottom text-xs font-semibold text-muted">Celular</th>
              {[0, 1, 2].map((i) => {
                const p = selected[i];
                return (
                  <th key={i} className="p-4 align-top font-normal">
                    {p ? (
                      <div className="relative text-center">
                        <button onClick={() => toggleCompare(p.id)} className="absolute -top-1 right-0 rounded-full p-1 text-muted hover:bg-surface hover:text-ink" aria-label={`Quitar ${productName(p)}`}><IconX size={16} /></button>
                        <Image src={p.image} alt="" width={120} height={120} className="mx-auto h-24 w-24 object-contain" />
                        <Link href={`/producto/${p.id}`} className="font-display mt-2 block font-medium hover:text-electric-600">{productName(p)}</Link>
                        {best?.id === p.id && <span className="mt-1 inline-block rounded-full bg-electric-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">Mejor para ti</span>}
                        {p.isDemo && <div className="mt-1"><DemoBadge /></div>}
                      </div>
                    ) : (
                      <select value="" onChange={(e) => e.target.value && toggleCompare(e.target.value)} className="input py-2.5 text-sm" aria-label={`Elegir celular ${i + 1}`}>
                        <option value="">+ Agregar celular</option>
                        {available.map((a) => <option key={a.id} value={a.id}>{productName(a)} · {formatCOP(a.priceCop)}</option>)}
                      </select>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          {selected.length > 0 && (
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-line">
                  <th scope="row" className="bg-surface/60 p-4 text-left text-xs font-semibold text-muted">{r.label}</th>
                  {[0, 1, 2].map((i) => <td key={i} className="p-4 text-center align-top">{selected[i] ? r.render(selected[i]) : null}</td>)}
                </tr>
              ))}
              <tr className="border-t border-line">
                <th scope="row" className="bg-surface/60 p-4" />
                {[0, 1, 2].map((i) => (
                  <td key={i} className="p-4 text-center">
                    {selected[i] && <button onClick={() => addToCart(selected[i])} disabled={selected[i].stock <= 0} className="btn-primary px-4 py-2.5"><IconCart size={16} />Agregar</button>}
                  </td>
                ))}
              </tr>
            </tbody>
          )}
        </table>
      </div>

      {selected.length < 2 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-center text-muted">Agrega al menos dos celulares para ver la conclusión.</p>
      ) : conclusion && best ? (
        <section className="hero-glow rounded-3xl p-6 text-white sm:p-8" aria-labelledby="conclusion">
          <h2 id="conclusion" className="text-2xl font-medium">Conclusión</h2>
          <p className="mt-2 text-white/80">
            Según lo que marcaste ({priorities.length ? priorities.map((p) => PRIORITIES.find((x) => x.id === p)!.label.toLowerCase()).join(", ") : "sin prioridades: equilibrio general"}),
            el que mejor se ajusta es <strong className="text-brand-cyan">{best.name}</strong>.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[...conclusion.results].sort((a, b) => b.score - a.score).map((r) => (
              <div key={r.id} className={`rounded-2xl p-4 ${r.id === best.id ? "bg-white text-ink" : "bg-white/10"}`}>
                <p className="font-semibold">{r.name}</p>
                <p className={`text-xs ${r.id === best.id ? "text-muted" : "text-white/60"}`}>Ajuste a tus prioridades: {r.score}/100</p>
                <ul className="mt-2 space-y-1 text-xs">
                  {r.reasons.slice(0, 2).map((x) => <li key={x} className="flex gap-1"><IconCheck size={14} className="mt-0.5 shrink-0 text-emerald-500" />{x}</li>)}
                  {r.limitations.slice(0, 2).map((x) => <li key={x} className="flex gap-1"><IconInfo size={14} className="mt-0.5 shrink-0 text-amber-500" />{x}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <button onClick={() => openAdvisor(`Estoy comparando ${selected.map(productName).join(", ")}. Lo que más me importa: ${priorities.join(", ") || "equilibrio"}. ¿Cuál me recomiendas y por qué?`)} className="btn-cyan mt-6">Pedir la opinión del asesor</button>
        </section>
      ) : null}
    </div>
  );
}
