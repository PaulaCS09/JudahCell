/**
 * Motor de recomendaciones de JUDAH CELL.
 *
 * Es determinístico y transparente: puntúa cada celular según las necesidades
 * del cliente usando SOLO los datos del catálogo. Lo usan:
 *  - el Asesor JUDAH (la IA lo llama como herramienta y explica el resultado),
 *  - el comparador (para la conclusión),
 *  - el modo de respaldo cuando la IA no está disponible.
 */

export type PhoneLike = {
  id: string;
  brand: string;
  model: string;
  priceCop: number;
  stock: number;
  ramGb: number | null;
  storageGb: number | null;
  mainCameraMp: number | null;
  batteryMah: number | null;
  screen: string | null;
  performanceScore: number | null;
  cameraScore: number | null;
  batteryScore: number | null;
  has5g: boolean | null;
  highlights: string[];
};

export const USES = ["basico", "redes", "fotos", "video", "juegos", "trabajo", "estudio"] as const;
export type Use = (typeof USES)[number];
export const MUST_HAVES = ["5g", "amoled", "estabilizacion", "carga_rapida", "256gb"] as const;
export type MustHave = (typeof MUST_HAVES)[number];

export type NeedsProfile = {
  budgetMaxCop?: number | null;
  uses?: Use[];
  /** 0 = no importa, 1 = normal, 2 = importante, 3 = muy importante */
  cameraImportance?: number | null;
  batteryImportance?: number | null;
  performanceImportance?: number | null;
  storageMinGb?: number | null;
  preferredBrands?: string[];
  avoidedBrands?: string[];
  mustHave?: MustHave[];
};

export type Role = "mejor_opcion" | "alternativa_economica" | "mayores_prestaciones";

export type ScoredPhone = {
  id: string;
  name: string;
  priceCop: number;
  score: number; // 0..100
  overBudget: boolean;
  reasons: string[];
  limitations: string[];
  role?: Role;
};

export type RecommendationResult = {
  results: ScoredPhone[];
  excluded: { id: string; name: string; why: string }[];
  note?: string;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const name = (p: PhoneLike) => `${p.brand} ${p.model}`;

function meetsMustHave(p: PhoneLike, m: MustHave): boolean {
  const hl = p.highlights.join(" ").toLowerCase();
  switch (m) {
    case "5g": return !!p.has5g;
    case "amoled": return /oled/i.test(p.screen ?? "");
    case "estabilizacion": return /ois|estabilizaci/.test(hl);
    case "carga_rapida": return /carga r[aá]pida/.test(hl);
    case "256gb": return (p.storageGb ?? 0) >= 256;
  }
}

const MUST_LABEL: Record<MustHave, string> = {
  "5g": "5G", amoled: "pantalla AMOLED/OLED", estabilizacion: "estabilización óptica", carga_rapida: "carga rápida", "256gb": "256 GB o más",
};

export function weightsFor(profile: NeedsProfile) {
  const w = {
    camera: profile.cameraImportance ?? 1,
    battery: profile.batteryImportance ?? 1,
    performance: profile.performanceImportance ?? 1,
    storage: profile.storageMinGb ? 1.5 : 0.5,
    price: 1,
  };
  for (const u of profile.uses ?? []) {
    if (u === "fotos" || u === "video") { if (profile.cameraImportance == null) w.camera += 1.5; }
    if (u === "juegos") { if (profile.performanceImportance == null) w.performance += 2; if (profile.batteryImportance == null) w.battery += 0.5; }
    if (u === "redes") { if (profile.cameraImportance == null) w.camera += 0.5; if (profile.batteryImportance == null) w.battery += 0.5; }
    if (u === "trabajo" || u === "estudio") { if (profile.performanceImportance == null) w.performance += 0.5; w.storage += 0.5; if (profile.batteryImportance == null) w.battery += 0.5; }
    if (u === "basico") w.price += 1.5;
  }
  return w;
}

export function recommendPhones(phones: PhoneLike[], profile: NeedsProfile, max = 3): RecommendationResult {
  const excluded: RecommendationResult["excluded"] = [];
  const avoided = (profile.avoidedBrands ?? []).map((b) => b.toLowerCase());
  const preferred = (profile.preferredBrands ?? []).map((b) => b.toLowerCase());
  const budget = profile.budgetMaxCop && profile.budgetMaxCop > 0 ? profile.budgetMaxCop : null;
  const w = weightsFor(profile);

  const prices = phones.map((p) => p.priceCop);
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const maxBattery = Math.max(...phones.map((p) => p.batteryMah ?? 0));
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const cheapCutoff = sortedPrices[Math.max(0, Math.ceil(sortedPrices.length * 0.3) - 1)];

  const eligible: PhoneLike[] = [];
  for (const p of phones) {
    if (p.stock <= 0) { excluded.push({ id: p.id, name: name(p), why: "Sin unidades disponibles en este momento" }); continue; }
    if (avoided.includes(p.brand.toLowerCase())) { excluded.push({ id: p.id, name: name(p), why: "Marca que prefieres evitar" }); continue; }
    const missing = (profile.mustHave ?? []).filter((m) => !meetsMustHave(p, m));
    if (missing.length) { excluded.push({ id: p.id, name: name(p), why: `No cumple: ${missing.map((m) => MUST_LABEL[m]).join(", ")}` }); continue; }
    if (budget && p.priceCop > budget * 1.2) { excluded.push({ id: p.id, name: name(p), why: "Supera el presupuesto en más de 20 %" }); continue; }
    eligible.push(p);
  }

  const scored: ScoredPhone[] = eligible.map((p) => {
    const s = {
      camera: ((p.cameraScore ?? 1) - 1) / 4,
      battery: ((p.batteryScore ?? 1) - 1) / 4,
      performance: ((p.performanceScore ?? 1) - 1) / 4,
      storage: profile.storageMinGb
        ? (p.storageGb ?? 0) >= profile.storageMinGb ? 1 : 0.2
        : clamp01(((p.storageGb ?? 64) - 64) / 192),
      price: maxP === minP ? 1 : 1 - (p.priceCop - minP) / (maxP - minP),
    };
    const total = w.camera + w.battery + w.performance + w.storage + w.price;
    let score = (w.camera * s.camera + w.battery * s.battery + w.performance * s.performance + w.storage * s.storage + w.price * s.price) / total;
    if (preferred.includes(p.brand.toLowerCase())) score += 0.08;
    const overBudget = !!budget && p.priceCop > budget;
    if (overBudget) score -= 0.25;

    const reasons: string[] = [];
    const limitations: string[] = [];
    if (w.camera >= 2 && s.camera >= 0.5) reasons.push(`Cámara ${p.cameraScore! >= 4 ? "destacada" : "sólida"} (${p.mainCameraMp} MP)`);
    if (w.camera >= 2 && s.camera < 0.5) limitations.push("La cámara es básica para lo que buscas");
    if (w.battery >= 1.5 && s.battery >= 0.75) reasons.push(p.batteryMah ? `Batería de ${p.batteryMah} mAh${p.batteryMah === maxBattery ? " (la más grande del catálogo)" : ""}` : "Muy buena autonomía de batería");
    if (w.battery >= 2 && s.battery < 0.5) limitations.push("La batería no es de las más grandes");
    if (w.performance >= 2 && s.performance >= 0.75) reasons.push(`Rendimiento ${p.performanceScore === 5 ? "alto" : "medio-alto"}${p.ramGb ? ` con ${p.ramGb} GB de RAM` : ""}`);
    if (w.performance >= 2 && s.performance < 0.5) limitations.push("Rendimiento limitado para juegos o apps exigentes");
    if (profile.storageMinGb && (p.storageGb ?? 0) >= profile.storageMinGb) reasons.push(`${p.storageGb} GB de almacenamiento`);
    if (profile.storageMinGb && (p.storageGb ?? 0) < profile.storageMinGb) limitations.push(`Solo ${p.storageGb} GB; menos de lo que necesitas`);
    if (!profile.storageMinGb && (p.storageGb ?? 0) < 128) limitations.push(`${p.storageGb} GB de almacenamiento pueden quedarse cortos`);
    if (phones.length >= 4 && p.priceCop <= cheapCutoff) reasons.push("Uno de los precios más bajos del catálogo");
    if (preferred.includes(p.brand.toLowerCase())) reasons.push(`Es de ${p.brand}, una marca que prefieres`);
    for (const m of profile.mustHave ?? []) reasons.push(`Tiene ${MUST_LABEL[m]}`);
    if (!p.has5g) limitations.push("No tiene 5G");
    if (overBudget) limitations.push(`Supera tu presupuesto por ${Math.round(((p.priceCop - budget!) / budget!) * 100)} %`);
    if (p.stock > 0 && p.stock <= 3) limitations.push(`Pocas unidades (${p.stock})`);
    if (!reasons.length) reasons.push("Equilibrio entre precio y características");

    return { id: p.id, name: name(p), priceCop: p.priceCop, score: Math.round(clamp01(score) * 100), overBudget, reasons, limitations };
  });

  scored.sort((a, b) => b.score - a.score || a.priceCop - b.priceCop);

  if (max === Infinity) {
    // Modo comparador: devolver todos, el primero marcado como mejor opción
    return { results: scored.map((s, i) => (i === 0 ? { ...s, role: "mejor_opcion" as Role } : s)), excluded };
  }

  const inBudget = scored.filter((s) => !s.overBudget);
  const picked: ScoredPhone[] = [];
  const best = inBudget[0] ?? scored[0];
  if (best) picked.push({ ...best, role: "mejor_opcion" });

  if (best) {
    const econ = inBudget
      .filter((s) => s.id !== best.id && s.priceCop < best.priceCop && s.score >= best.score - 20)
      .sort((a, b) => a.priceCop - b.priceCop)[0];
    if (econ) picked.push({ ...econ, role: "alternativa_economica" });

    const specOf = (id: string) => {
      const p = eligible.find((e) => e.id === id)!;
      return (p.performanceScore ?? 0) + (p.cameraScore ?? 0) + (p.batteryScore ?? 0) / 2;
    };
    const premium = scored
      .filter((s) => !picked.some((x) => x.id === s.id) && s.priceCop > best.priceCop && specOf(s.id) > specOf(best.id))
      .sort((a, b) => Number(a.overBudget) - Number(b.overBudget) || specOf(b.id) - specOf(a.id))[0];
    if (premium) picked.push({ ...premium, role: "mayores_prestaciones" });
  }

  for (const s of inBudget) {
    if (picked.length >= Math.min(max, 2)) break;
    if (!picked.some((x) => x.id === s.id)) picked.push(s);
  }

  let note: string | undefined;
  if (!eligible.length) note = "Ningún celular del catálogo cumple todas las condiciones. Conviene flexibilizar presupuesto o requisitos.";
  else if (budget && !inBudget.length) note = "No hay celulares dentro del presupuesto; las opciones mostradas lo superan.";

  return { results: picked.slice(0, max), excluded, note };
}

export const ROLE_LABEL: Record<Role, string> = {
  mejor_opcion: "Mejor opción para ti",
  alternativa_economica: "Alternativa económica",
  mayores_prestaciones: "Mayores prestaciones",
};
