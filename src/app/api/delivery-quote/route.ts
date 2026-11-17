import { NextResponse } from "next/server";
import { z } from "zod";
import { getSettings } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const schema = z.object({ locality: z.string().trim().min(2).max(60), address: z.string().trim().max(160).optional() });

/**
 * Cotización de domicilio. JUDAH CELL aún no tiene tarifas definidas:
 * si `settings.delivery.rates` está vacío se responde "por confirmar" (no se inventan tarifas).
 * Para activarlo, cargar en settings.delivery.rates: [{ "locality": "Chapinero", "costCop": 12000 }, ...]
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation", message: "Indica la localidad" }, { status: 400 });
  const s = await getSettings();
  if (!s.delivery.home.enabled) return NextResponse.json({ available: false, message: "El domicilio no está disponible por ahora." });
  const rate = s.delivery.rates?.find((r) => r.locality.toLowerCase() === parsed.data.locality.toLowerCase());
  if (!rate) {
    return NextResponse.json({
      available: true,
      costCop: null,
      message: "El costo del domicilio depende de tu ubicación y te lo confirmará un asesor de JUDAH CELL antes del despacho.",
    });
  }
  return NextResponse.json({ available: true, costCop: rate.costCop, estimatedTime: s.delivery.estimated_times });
}
