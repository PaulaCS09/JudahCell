import { formatCOP } from "@/lib/format";
import type { NeedsProfile } from "@/lib/recommend";

const USE_LABEL: Record<string, string> = { basico: "Uso básico", redes: "Redes sociales", fotos: "Fotos", video: "Video", juegos: "Juegos", trabajo: "Trabajo", estudio: "Estudio" };
const IMP = ["No importa", "Normal", "Importante", "Muy importante"];
const MUST: Record<string, string> = { "5g": "5G", amoled: "Pantalla AMOLED", estabilizacion: "Estabilización", carga_rapida: "Carga rápida", "256gb": "256 GB+" };

export function profileChips(p: NeedsProfile): { k: string; label: string }[] {
  const chips: { k: string; label: string }[] = [];
  if (p.budgetMaxCop) chips.push({ k: "budget", label: `Hasta ${formatCOP(p.budgetMaxCop)}` });
  for (const u of p.uses ?? []) chips.push({ k: `u-${u}`, label: USE_LABEL[u] ?? u });
  if (p.cameraImportance != null) chips.push({ k: "cam", label: `Cámara: ${IMP[p.cameraImportance]}` });
  if (p.batteryImportance != null) chips.push({ k: "bat", label: `Batería: ${IMP[p.batteryImportance]}` });
  if (p.performanceImportance != null) chips.push({ k: "perf", label: `Rendimiento: ${IMP[p.performanceImportance]}` });
  if (p.storageMinGb) chips.push({ k: "sto", label: `Mín. ${p.storageMinGb} GB` });
  for (const b of p.preferredBrands ?? []) chips.push({ k: `pb-${b}`, label: `Prefiere ${b}` });
  for (const b of p.avoidedBrands ?? []) chips.push({ k: `ab-${b}`, label: `Evita ${b}` });
  for (const m of p.mustHave ?? []) chips.push({ k: `m-${m}`, label: `Indispensable: ${MUST[m] ?? m}` });
  return chips;
}

export function ProfileSummary({ profile, dark = false }: { profile: NeedsProfile; dark?: boolean }) {
  const chips = profileChips(profile);
  if (!chips.length)
    return <p className={`text-sm ${dark ? "text-white/60" : "text-muted"}`}>Aún no me has contado nada. A medida que conversemos, aquí verás lo que entendí de tus necesidades.</p>;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Lo que el asesor entendió de ti">
      {chips.map((c) => (
        <li key={c.k} className={`rounded-full px-3 py-1 text-xs font-medium ${dark ? "border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan" : "border border-electric-400/30 bg-electric-500/5 text-electric-600"}`}>{c.label}</li>
      ))}
    </ul>
  );
}
