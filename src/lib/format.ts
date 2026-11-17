const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export function formatCOP(value: number): string {
  return cop.format(value).replace(/ /g, " ");
}

export function productName(p: { brand: string; model: string }) {
  return p.brand.startsWith("Genérico") ? p.model : `${p.brand} ${p.model}`;
}

export function storageLabel(gb: number | null | undefined) {
  if (!gb) return null;
  return gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`;
}

export const PERFORMANCE_LABEL = ["", "Básico", "Básico +", "Medio", "Medio-alto", "Alto"];
