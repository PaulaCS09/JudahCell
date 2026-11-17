import { NextResponse } from "next/server";
import { createOrder, findOrder, OrderError } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { orderLookupSchema, orderRequestSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

/** Crear solicitud de pedido (demostrativa, sin cobros). */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!rateLimit(`order:${clientIp(req)}`, 5).ok) {
    return NextResponse.json({ error: "rate_limited", message: "Demasiados intentos. Espera un minuto." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = orderRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return NextResponse.json({ error: "validation", message: "Revisa los datos del formulario.", fieldErrors }, { status: 400 });
  }
  try {
    const { acceptsDataPolicy: _accepted, ...data } = parsed.data;
    const order = await createOrder({ ...data, email: data.email || undefined });
    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: "order", message: e.message }, { status: 409 });
    console.error("[orders] error", e);
    return NextResponse.json({ error: "server", message: "No pudimos registrar tu pedido. Intenta de nuevo." }, { status: 500 });
  }
}

/** Consultar pedido: requiere código y celular. */
export async function GET(req: Request) {
  if (!rateLimit(`lookup:${clientIp(req)}`, 15).ok) {
    return NextResponse.json({ error: "rate_limited", message: "Demasiadas consultas. Espera un minuto." }, { status: 429 });
  }
  const sp = new URL(req.url).searchParams;
  const parsed = orderLookupSchema.safeParse({ code: sp.get("code") ?? "", phone: sp.get("phone") ?? "" });
  if (!parsed.success) return NextResponse.json({ error: "validation", message: "Escribe el código (JC-XXXXXX) y el celular con el que hiciste el pedido." }, { status: 400 });
  const order = await findOrder(parsed.data.code, parsed.data.phone);
  if (!order) return NextResponse.json({ error: "not_found", message: "No encontramos un pedido con esos datos." }, { status: 404 });
  return NextResponse.json({ order });
}
