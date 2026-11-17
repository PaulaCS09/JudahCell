import "server-only";

/**
 * Cliente mínimo para la API REST de Google Gemini (generateContent) con function calling.
 * Se usa REST directo (sin SDK) para mantener el proyecto liviano y fácil de cambiar de proveedor.
 */

export type GeminiPart =
  | { text: string; thought?: boolean; thoughtSignature?: string }
  | { functionCall: { name: string; args?: Record<string, unknown> }; thoughtSignature?: string }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

export type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

export class AIError extends Error {
  constructor(public code: "not_configured" | "rate_limited" | "upstream" | "timeout" | "blocked", message: string) {
    super(message);
  }
}

export function aiConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

export async function generate(opts: {
  system: string;
  contents: GeminiContent[];
  tools: readonly object[];
  timeoutMs?: number;
}): Promise<GeminiContent> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AIError("not_configured", "GEMINI_API_KEY no está configurada");
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  const body = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: opts.contents,
    tools: [{ functionDeclarations: opts.tools }],
    toolConfig: { functionCallingConfig: { mode: "AUTO" } },
    generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
  };

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 30_000);
    try {
      const res = await fetch(
        `${process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta"}/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        },
      );
      if (res.status === 429) throw new AIError("rate_limited", "Límite de uso de la IA alcanzado");
      if (res.status >= 500) { lastErr = new AIError("upstream", `Gemini ${res.status}`); await new Promise((r) => setTimeout(r, 800)); continue; }
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("[gemini] error", res.status, detail.slice(0, 500));
        throw new AIError("upstream", `Gemini respondió ${res.status}`);
      }
      const data = await res.json();
      const cand = data?.candidates?.[0];
      if (!cand?.content?.parts?.length) {
        if (cand?.finishReason === "SAFETY" || data?.promptFeedback?.blockReason) throw new AIError("blocked", "Respuesta bloqueada por filtros de seguridad");
        return { role: "model", parts: [{ text: "" }] };
      }
      return { role: "model", parts: cand.content.parts as GeminiPart[] };
    } catch (e) {
      if (e instanceof AIError && e.code !== "upstream") throw e;
      if ((e as Error)?.name === "AbortError") lastErr = new AIError("timeout", "La IA tardó demasiado en responder");
      else lastErr = e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof AIError ? lastErr : new AIError("upstream", "No se pudo contactar el servicio de IA");
}
