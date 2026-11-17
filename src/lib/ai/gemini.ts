import "server-only";

/**
 * Cliente mínimo para la API REST de Google Gemini (generateContent) con function calling.
 * Se usa REST directo (sin SDK) para mantener el proyecto liviano y fácil de cambiar de proveedor.
 *
 * GEMINI_MODEL admite una lista separada por comas: si un modelo falla (no existe,
 * está saturado o tarda demasiado) se intenta con el siguiente.
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

const DEFAULT_MODELS = "gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-3.5-flash";

export function aiConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

function models() {
  return (process.env.GEMINI_MODEL || DEFAULT_MODELS).split(",").map((m) => m.trim()).filter(Boolean);
}

/** Modelo que respondió bien la última vez (se prueba primero en las siguientes llamadas). */
let preferredModel: string | null = null;

function thinkingFor(model: string, disabled: boolean) {
  if (disabled) return undefined;
  // Gemini 3.x usa thinkingLevel; 2.5 usa thinkingBudget. Se pide poco "pensamiento" para responder rápido.
  if (/^gemini-[3-9]/.test(model)) return { thinkingLevel: "low" };
  if (/^gemini-2\.5-flash/.test(model)) return { thinkingBudget: 0 };
  return undefined;
}

export async function generate(opts: {
  system: string;
  contents: GeminiContent[];
  tools: readonly object[];
  timeoutMs?: number;
}): Promise<GeminiContent> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AIError("not_configured", "GEMINI_API_KEY no está configurada");
  const base = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";

  let list = models();
  if (preferredModel && list.includes(preferredModel)) list = [preferredModel, ...list.filter((m) => m !== preferredModel)];

  let lastErr: AIError = new AIError("upstream", "No se pudo contactar el servicio de IA");
  for (const model of list) {
    let noThinking = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      const thinkingConfig = thinkingFor(model, noThinking);
      const body = {
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: opts.contents,
        tools: [{ functionDeclarations: opts.tools }],
        toolConfig: { functionCallingConfig: { mode: "AUTO" } },
        generationConfig: { temperature: 0.4, maxOutputTokens: 4096, ...(thinkingConfig ? { thinkingConfig } : {}) },
      };
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 25_000);
      const started = Date.now();
      try {
        const res = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const detail = (await res.text().catch(() => "")).slice(0, 600);
          console.error(`[gemini] ${model} respondió ${res.status} en ${Date.now() - started} ms: ${detail}`);
          if (res.status === 400 && thinkingConfig && /thinking/i.test(detail)) { noThinking = true; continue; }
          if (res.status === 429) { lastErr = new AIError("rate_limited", "Límite de uso de la IA alcanzado"); break; }
          if (res.status === 401 || res.status === 403) throw new AIError("not_configured", "La API key de Gemini no es válida o no tiene permisos");
          lastErr = new AIError("upstream", `Gemini respondió ${res.status}`);
          if (res.status >= 500 && attempt === 0) { await new Promise((r) => setTimeout(r, 600)); continue; }
          break; // 400/404 u otro: probar el siguiente modelo
        }
        const data = await res.json();
        const cand = data?.candidates?.[0];
        preferredModel = model;
        if (!cand?.content?.parts?.length) {
          if (cand?.finishReason === "SAFETY" || data?.promptFeedback?.blockReason) throw new AIError("blocked", "Respuesta bloqueada por filtros de seguridad");
          console.warn(`[gemini] ${model} devolvió una respuesta vacía (finishReason=${cand?.finishReason})`);
          return { role: "model", parts: [{ text: "" }] };
        }
        return { role: "model", parts: cand.content.parts as GeminiPart[] };
      } catch (e) {
        if (e instanceof AIError) throw e;
        if ((e as Error)?.name === "AbortError") {
          console.error(`[gemini] ${model} no respondió en ${Date.now() - started} ms`);
          lastErr = new AIError("timeout", "La IA tardó demasiado en responder");
          break; // probar el siguiente modelo
        }
        console.error(`[gemini] ${model} error de red:`, (e as Error)?.message, (e as { cause?: unknown })?.cause);
        lastErr = new AIError("upstream", "No se pudo contactar el servicio de IA");
      } finally {
        clearTimeout(timer);
      }
    }
  }
  throw lastErr;
}
