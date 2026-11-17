import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Diagnóstico temporal de la conexión con Gemini (solo estados y tiempos; nunca la clave). */
export async function GET(req: Request) {
  if (!rateLimit(`diag:${clientIp(req)}`, 3).ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ keyConfigured: false });
  const base = "https://generativelanguage.googleapis.com/v1beta";
  const out: Record<string, unknown> = { keyConfigured: true, keyLength: key.length, modelEnv: process.env.GEMINI_MODEL ?? null };

  async function probe(name: string, url: string, init?: RequestInit) {
    const t = Date.now();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15_000);
    try {
      const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", "x-goog-api-key": key!, ...(init?.headers ?? {}) }, signal: ctrl.signal });
      const text = await r.text();
      out[name] = { status: r.status, ms: Date.now() - t, body: text.slice(0, 300) };
    } catch (e) {
      out[name] = { error: (e as Error).name + ": " + (e as Error).message, cause: String((e as { cause?: unknown }).cause ?? ""), ms: Date.now() - t };
    } finally {
      clearTimeout(timer);
    }
  }

  await probe("listModels", `${base}/models?pageSize=50`, { method: "GET" });
  try {
    const lm = out.listModels as { body?: string };
    out.listModels = { ...(out.listModels as object), body: undefined };
    const r = await fetch(`${base}/models?pageSize=200`, { headers: { "x-goog-api-key": key } });
    const j = await r.json();
    out.flashModels = (j.models ?? []).map((m: { name: string }) => m.name.replace("models/", "")).filter((n: string) => /flash/.test(n)).slice(0, 30);
    void lm;
  } catch {}
  const model = new URL(req.url).searchParams.get("model") || (process.env.GEMINI_MODEL || "gemini-3.5-flash").split(",")[0];
  out.testedModel = model;
  await probe("simple", `${base}/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Di hola en una palabra." }] }] }),
  });
  return NextResponse.json(out);
}
