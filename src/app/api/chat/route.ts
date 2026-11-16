import { NextResponse } from "next/server";
import { AIError, generate, type GeminiContent, type GeminiPart } from "@/lib/ai/gemini";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { runTool, toolDeclarations, type ToolState } from "@/lib/ai/tools";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { chatRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TOOL_ROUNDS = 6;
const HISTORY_LIMIT = 20;

const ERROR_MESSAGES: Record<AIError["code"], { status: number; message: string }> = {
  not_configured: { status: 503, message: "El asesor con IA no está configurado en este servidor. Puedes usar el modo guiado mientras tanto." },
  rate_limited: { status: 429, message: "El asesor está recibiendo muchas consultas. Intenta de nuevo en un minuto o usa el modo guiado." },
  timeout: { status: 504, message: "El asesor tardó demasiado en responder. ¿Lo intentamos otra vez?" },
  upstream: { status: 502, message: "No pudimos conectar con el asesor en este momento. Intenta de nuevo o usa el modo guiado." },
  blocked: { status: 400, message: "No puedo ayudar con ese mensaje. ¿Te ayudo a encontrar un celular o accesorio?" },
};

export async function POST(req: Request) {
  const limit = Number(process.env.CHAT_RATE_LIMIT_PER_MIN || 12);
  const rl = rateLimit(`chat:${clientIp(req)}`, limit);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: `Has enviado muchos mensajes seguidos. Espera ${rl.retryAfter} s, por favor.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Solicitud no válida" }, { status: 400 });
  }
  const parsed = chatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request", message: "Mensaje no válido (máximo 2000 caracteres)." }, { status: 400 });
  }
  const { messages, profile, context } = parsed.data;
  if (messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "bad_request", message: "El último mensaje debe ser del cliente" }, { status: 400 });
  }

  // Historial: solo texto, últimos N mensajes, iniciando por un mensaje del usuario.
  let history = messages.slice(-HISTORY_LIMIT);
  while (history.length && history[0].role !== "user") history = history.slice(1);
  const contents: GeminiContent[] = history.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  const state: ToolState = { profile, cards: [] };
  const system = buildSystemPrompt({ profile, context });
  const toolsUsed: string[] = [];

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const reply = await generate({ system, contents, tools: toolDeclarations });
      contents.push(reply); // se conserva tal cual (incluye thoughtSignature si el modelo lo envía)

      const calls = reply.parts.filter((p): p is Extract<GeminiPart, { functionCall: unknown }> => "functionCall" in p);
      if (!calls.length || round === MAX_TOOL_ROUNDS) {
        const text = reply.parts
          .filter((p): p is { text: string; thought?: boolean } => "text" in p && !p.thought)
          .map((p) => p.text)
          .join("")
          .trim();
        return NextResponse.json({
          reply: text || "Listo. ¿Quieres que te explique alguna de estas opciones con más detalle?",
          profile: state.profile,
          cards: state.cards,
          toolsUsed,
        });
      }

      const responses: GeminiPart[] = [];
      for (const c of calls) {
        toolsUsed.push(c.functionCall.name);
        let result: unknown;
        try {
          result = await runTool(c.functionCall.name, c.functionCall.args ?? {}, state);
        } catch (e) {
          console.error("[chat] tool error", c.functionCall.name, e);
          result = { error: "No fue posible consultar la información en este momento." };
        }
        responses.push({ functionResponse: { name: c.functionCall.name, response: { result } as Record<string, unknown> } });
      }
      contents.push({ role: "user", parts: responses });
    }
  } catch (e) {
    const err = e instanceof AIError ? e : new AIError("upstream", String(e));
    if (!(e instanceof AIError)) console.error("[chat] unexpected", e);
    const info = ERROR_MESSAGES[err.code];
    return NextResponse.json({ error: err.code, message: info.message, profile: state.profile, cards: state.cards }, { status: info.status });
  }
  return NextResponse.json({ error: "upstream", message: ERROR_MESSAGES.upstream.message }, { status: 502 });
}
