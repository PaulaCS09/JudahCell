"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Product } from "@/lib/db/schema";
import { AdvisorAvatar } from "../Brand";
import { IconRefresh, IconSend } from "../Icons";
import { useStore, type ChatMessage } from "../providers/StoreProvider";
import { ChatCards } from "./ChatCards";
import { GuidedMode } from "./GuidedMode";
import { Markdown } from "./Markdown";

export const WELCOME =
  "¡Hola! Soy tu asesor de JUDAH CELL. Estoy aquí para ayudarte a encontrar el celular ideal. No necesitas saber de tecnología, solo cuéntame qué necesitas.";

const STARTERS = [
  "Busco un celular de menos de $900.000",
  "Quiero tomar muy buenas fotos",
  "Necesito que la batería dure todo el día",
  "Es para un familiar que solo usa WhatsApp",
  "Quiero jugar sin que se trabe",
];

const uid = () => Math.random().toString(36).slice(2, 10);

export function AdvisorChat({ variant = "page" }: { variant?: "page" | "drawer" }) {
  const { chat, setChat, profile, setProfile, resetAdvisor, cart, compare, consumePendingPrompt, advisorOpen } = useStore();
  const pathname = usePathname();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [guided, setGuided] = useState(false);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [chat, loading]);

  const send = useCallback(async (text: string) => {
    const clean = text.trim().slice(0, 2000);
    if (!clean || loading) return;
    const userMsg: ChatMessage = { id: uid(), role: "user", text: clean };
    const history = [...chat.filter((m) => !m.error), userMsg];
    setChat(() => history);
    setInput("");
    setLoading(true);
    setLastErrorCode(null);
    const productId = pathname.startsWith("/producto/") ? pathname.split("/")[2] : undefined;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, text: m.text })),
          profile,
          context: { page: pathname, productId, cartProductIds: cart.map((c) => c.id), compareProductIds: compare },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.profile) setProfile(data.profile);
      if (!res.ok) {
        setLastErrorCode(data.error ?? "upstream");
        setChat((prev) => [...prev, { id: uid(), role: "assistant", text: data.message ?? "Ocurrió un error. Intenta de nuevo.", error: true }]);
      } else {
        setChat((prev) => [...prev, { id: uid(), role: "assistant", text: data.reply, cards: data.cards?.length ? data.cards : undefined }]);
      }
    } catch {
      setLastErrorCode("network");
      setChat((prev) => [...prev, { id: uid(), role: "assistant", text: "No hay conexión con el asesor. Revisa tu internet e intenta de nuevo.", error: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [chat, loading, pathname, profile, cart, compare, setChat, setProfile]);

  // Mensaje precargado desde otras secciones (ej. "Pregúntale al asesor sobre este celular")
  useEffect(() => {
    if (variant === "drawer" && !advisorOpen) return;
    const p = consumePendingPrompt();
    if (p) send(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisorOpen]);

  function retry() {
    const lastUser = [...chat].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setChat((prev) => prev.filter((m) => !m.error && m.id !== lastUser.id));
    setTimeout(() => send(lastUser.text), 0);
  }

  const askAccessories = (p: Product) => send(`Me interesa el ${p.brand} ${p.model}. ¿Qué accesorios compatibles me recomiendas?`);

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  const empty = chat.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scroller} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5" aria-live="polite" aria-busy={loading}>
        <Bubble role="assistant"><Markdown text={WELCOME} /></Bubble>

        {empty && !guided && (
          <div className="space-y-2 pl-12">
            <p className="text-xs font-medium text-muted">Puedes empezar con algo como:</p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-electric-400/40 bg-white px-3 py-1.5 text-left text-xs font-medium text-electric-600 transition hover:bg-electric-500 hover:text-white">{s}</button>
              ))}
            </div>
          </div>
        )}

        {chat.map((m) => (
          <div key={m.id} className="space-y-2">
            <Bubble role={m.role} error={m.error}>{m.role === "assistant" ? <Markdown text={m.text} /> : m.text}</Bubble>
            {m.cards && <div className={variant === "page" ? "pl-12" : "pl-0"}><ChatCards cards={m.cards} onAskAccessories={askAccessories} /></div>}
          </div>
        ))}

        {lastErrorCode && !loading && (
          <div className="flex flex-wrap gap-2 pl-12">
            {lastErrorCode !== "not_configured" && <button onClick={retry} className="btn-outline px-3 py-2 text-xs">Reintentar</button>}
            <button onClick={() => setGuided(true)} className="btn-outline px-3 py-2 text-xs">Usar modo guiado (sin IA)</button>
          </div>
        )}

        {guided && <GuidedMode onClose={() => setGuided(false)} />}

        {loading && (
          <div className="flex items-center gap-3">
            <AdvisorAvatar size={36} />
            <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm" aria-label="El asesor está escribiendo">
              <span className="typing-dot h-2 w-2 rounded-full bg-electric-500" /><span className="typing-dot h-2 w-2 rounded-full bg-electric-500" /><span className="typing-dot h-2 w-2 rounded-full bg-electric-500" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-line bg-white p-3 sm:p-4">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2">
          <label className="sr-only" htmlFor={`chat-input-${variant}`}>Escribe tu mensaje al asesor</label>
          <textarea
            id={`chat-input-${variant}`}
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 2000))}
            onKeyDown={onKey}
            rows={1}
            placeholder="Cuéntame qué necesitas…"
            className="input max-h-36 min-h-12 resize-none"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-electric-500 text-white transition hover:bg-electric-600 disabled:opacity-40" aria-label="Enviar mensaje">
            <IconSend size={20} />
          </button>
        </form>
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted">
          <span>Asesor con IA · Puede cometer errores; los precios siempre salen del catálogo.</span>
          {!empty && <button onClick={() => { resetAdvisor(); setGuided(false); setLastErrorCode(null); }} className="inline-flex shrink-0 items-center gap-1 font-semibold text-electric-600 hover:underline"><IconRefresh size={13} />Nueva conversación</button>}
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, children, error }: { role: "user" | "assistant"; children: React.ReactNode; error?: boolean }) {
  if (role === "user")
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-electric-500 px-4 py-2.5 text-sm whitespace-pre-wrap text-white">{children}</div>
      </div>
    );
  return (
    <div className="flex items-start gap-3">
      <AdvisorAvatar size={36} />
      <div className={`max-w-[88%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm ${error ? "border border-rose-200 bg-rose-50 text-rose-900" : "bg-white text-ink"}`}>{children}</div>
    </div>
  );
}
