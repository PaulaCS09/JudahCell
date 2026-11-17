"use client";

import { IconCheck } from "./Icons";
import { useStore } from "./providers/StoreProvider";

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed top-20 right-4 z-[60] flex flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-3 text-sm text-white shadow-xl">
          <IconCheck size={16} className="text-brand-cyan" />{t.text}
        </div>
      ))}
    </div>
  );
}
