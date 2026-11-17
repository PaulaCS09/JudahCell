"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Logo } from "./Brand";
import { IconCart, IconChat, IconMenu, IconSearch, IconX } from "./Icons";
import { useStore } from "./providers/StoreProvider";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo?categoria=celulares", label: "Celulares", match: "celulares" },
  { href: "/catalogo?categoria=accesorios", label: "Accesorios", match: "accesorios" },
  { href: "/comparar", label: "Comparar" },
  { href: "/garantia-y-entregas", label: "Garantía y entregas" },
];

export function Header() {
  const { cartCount, compare } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => setOpen(false), [pathname]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    router.push(`/catalogo${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  }

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]) && href.split("?")[0] !== "/catalogo") ;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/95 backdrop-blur supports-[backdrop-filter]:bg-navy-950/85">
      <div className="container-x flex h-16 items-center gap-4 sm:h-[72px]">
        <Logo />

        <nav aria-label="Principal" className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/10 hover:text-white ${isActive(n.href) ? "text-white" : "text-white/70"}`}>
              {n.label}
              {n.href === "/comparar" && compare.length > 0 && <span className="ml-1.5 rounded-full bg-brand-cyan px-1.5 text-[11px] font-bold text-navy-950">{compare.length}</span>}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearch} role="search" className="ml-auto hidden max-w-xs flex-1 md:block">
          <label className="relative block">
            <span className="sr-only">Buscar productos</span>
            <IconSearch size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/50" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar celular o accesorio" className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-3 pl-10 text-sm text-white placeholder:text-white/45 focus:border-brand-cyan/60 focus:outline-none" />
          </label>
        </form>

        <Link href="/asesor" className="hidden items-center gap-2 rounded-xl bg-brand-cyan px-4 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-white sm:inline-flex">
          <IconChat size={18} /> Asesor inteligente
        </Link>

        <Link href="/carrito" className="relative ml-auto rounded-xl p-2.5 text-white hover:bg-white/10 md:ml-0" aria-label={`Carrito, ${cartCount} productos`}>
          <IconCart size={22} />
          {cartCount > 0 && <span className="absolute top-1 right-1 grid h-5 min-w-5 place-items-center rounded-full bg-electric-500 px-1 text-[11px] font-bold text-white">{cartCount}</span>}
        </Link>

        <button onClick={() => setOpen((o) => !o)} className="rounded-xl p-2.5 text-white hover:bg-white/10 lg:hidden" aria-expanded={open} aria-controls="menu-movil" aria-label="Abrir menú">
          {open ? <IconX size={22} /> : <IconMenu size={22} />}
        </button>
      </div>

      {open && (
        <div id="menu-movil" className="border-t border-white/10 bg-navy-950 lg:hidden">
          <div className="container-x space-y-1 py-4">
            <form onSubmit={onSearch} role="search" className="mb-3">
              <label className="relative block">
                <span className="sr-only">Buscar productos</span>
                <IconSearch size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/50" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar celular o accesorio" className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-3 pl-10 text-sm text-white placeholder:text-white/45" />
              </label>
            </form>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-3 text-base text-white/85 hover:bg-white/10">{n.label}</Link>
            ))}
            <Link href="/pedidos" className="block rounded-lg px-3 py-3 text-base text-white/85 hover:bg-white/10">Mis pedidos</Link>
            <Link href="/asesor" className="btn-cyan mt-2 w-full"><IconChat size={18} /> Hablar con el Asesor JUDAH</Link>
          </div>
        </div>
      )}
    </header>
  );
}
