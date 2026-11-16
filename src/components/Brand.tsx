import Image from "next/image";
import Link from "next/link";

/** Logo oficial (ícono recortado del logo de JUDAH CELL) + nombre. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="JUDAH CELL, ir al inicio">
      <Image src="/brand/logo-mark.png" alt="" width={44} height={44} className="h-10 w-10 rounded-full ring-2 ring-brand-cyan/50 sm:h-11 sm:w-11" priority />
      {!compact && (
        <span className="leading-none">
          <span className="font-display block text-lg font-medium tracking-[0.18em] text-white sm:text-xl">JUDAH CELL</span>
          <span className="font-display block text-[10px] tracking-[0.42em] text-brand-cyan/90">DEJA HUELLA</span>
        </span>
      )}
    </Link>
  );
}

export function AdvisorAvatar({ size = 40 }: { size?: number }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <Image src="/brand/logo-mark.png" alt="Asesor JUDAH" width={size} height={size} className="rounded-full ring-2 ring-brand-cyan" />
      <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" aria-hidden />
    </span>
  );
}

export function DemoBadge({ label = "Demo" }: { label?: string }) {
  return <span className="demo-badge" title="Dato ficticio del prototipo">{label}</span>;
}
