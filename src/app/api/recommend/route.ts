import { NextResponse } from "next/server";
import { getPhones } from "@/lib/catalog";
import { recommendPhones } from "@/lib/recommend";
import { needsProfileSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Motor de recomendaciones sin IA (modo guiado y respaldo). */
export async function POST(req: Request) {
  if (!rateLimit(`rec:${clientIp(req)}`, 40).ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const body = await req.json().catch(() => null);
  const parsed = needsProfileSchema.safeParse(body?.profile ?? {});
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const phones = await getPhones();
  const r = recommendPhones(phones, parsed.data, 3);
  const byId = new Map(phones.map((p) => [p.id, p]));
  return NextResponse.json({
    note: r.note,
    items: r.results.map((x) => ({ product: byId.get(x.id), role: x.role, reasons: x.reasons, limitations: x.limitations, overBudget: x.overBudget, score: x.score })),
    excluded: r.excluded,
  });
}
