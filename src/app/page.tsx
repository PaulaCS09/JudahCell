import Image from "next/image";
import Link from "next/link";
import { AdvisorAvatar } from "@/components/Brand";
import { AskAdvisorButton, HeroActions, HeroAsk } from "@/components/HeroAsk";
import { IconArrowRight, IconCompare, IconShield, IconStore, IconTruck, IconWallet } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";
import { getPhones, listProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { href: "/catalogo?categoria=celulares", label: "Celulares", img: "/products/galaxy-a37.webp" },
  { href: "/catalogo?categoria=audifonos", label: "Audífonos", img: "/products/jbl-tune-780nc.webp" },
  { href: "/catalogo?categoria=cargadores", label: "Cargadores", img: "/products/ilustraciones/cargador.svg" },
  { href: "/catalogo?categoria=proteccion", label: "Fundas y vidrios", img: "/products/ilustraciones/funda.svg" },
  { href: "/catalogo?categoria=otros", label: "Otros accesorios", img: "/products/smartwatch-2i.webp" },
];

const STEPS = [
  { n: "1", t: "Cuéntame qué necesitas", d: "Con tus palabras: para qué lo usas, cuánto quieres invertir y qué es importante para ti." },
  { n: "2", t: "Reviso el catálogo por ti", d: "Consulto los productos disponibles, sus precios y características reales. Nada inventado." },
  { n: "3", t: "Te muestro 2 o 3 opciones", d: "La mejor para ti, una alternativa económica y una con más prestaciones, con ventajas y limitaciones." },
  { n: "4", t: "Tú decides, sin presión", d: "Compara, pregunta todo lo que quieras y agrega al carrito solo si te convence." },
];

export default async function Home() {
  const phones = await getPhones();
  const featured = phones.filter((p) => ["galaxy-a37", "redmi-15c", "moto-g67", "iphone-17e"].includes(p.id));
  const accessories = (await listProducts({ category: "audifonos" })).slice(0, 2);

  return (
    <>
      {/* HERO */}
      <section className="hero-glow relative overflow-hidden text-white">
        <div className="hex-pattern absolute inset-0" aria-hidden />
        <div className="container-x relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-xs font-medium text-brand-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" /> Celulares y accesorios originales · Bogotá
            </p>
            <h1 className="text-4xl leading-[1.08] font-medium sm:text-5xl lg:text-[3.6rem]">
              Encuentra la tecnología que <span className="text-brand-cyan">realmente necesitas.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-white/75">
              Cuéntanos qué buscas y nuestro asesor inteligente te ayudará a encontrar el celular ideal para ti.
            </p>
            <HeroActions />
            <div className="max-w-xl pt-2"><HeroAsk /></div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 rounded-[2rem] bg-electric-500/20 blur-3xl" aria-hidden />
            <div className="relative rounded-3xl border border-white/10 bg-navy-900/80 p-5 shadow-2xl backdrop-blur">
              <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
                <AdvisorAvatar size={44} />
                <div><p className="font-semibold">Asesor JUDAH</p><p className="text-xs text-white/55">En línea · responde con el catálogo real</p></div>
              </div>
              <p className="mb-2 text-[10px] font-semibold tracking-widest text-white/40 uppercase">Ejemplo de conversación</p>
              <div className="space-y-3 text-sm">
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-electric-500 px-3.5 py-2">Quiero uno que aguante todo el día, tengo como $650.000</p>
                <p className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2 text-white/90">¡Perfecto! ¿Lo usas más para redes y WhatsApp, o también para juegos? Así te recomiendo con precisión.</p>
                <div className="flex gap-2 rounded-2xl bg-white p-2.5 text-ink">
                  <Image src="/products/redmi-15c.webp" alt="" width={64} height={64} className="h-14 w-14 object-contain" />
                  <div className="text-xs">
                    <p className="mb-0.5 inline-block rounded bg-electric-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">Mejor opción para ti</p>
                    <p className="font-semibold">Xiaomi Redmi 15C</p>
                    <p className="text-muted">Batería de 6000 mAh · 128 GB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONFIANZA */}
      <section className="border-b border-line bg-white">
        <div className="container-x grid grid-cols-2 gap-4 py-6 lg:grid-cols-4">
          {[
            { i: <IconShield size={22} />, t: "Garantía de 6 meses", d: "Por funcionamiento" },
            { i: <IconStore size={22} />, t: "Recoge en tienda", d: "Punto físico en Bogotá" },
            { i: <IconTruck size={22} />, t: "Domicilio en Bogotá", d: "Costo según tu ubicación" },
            { i: <IconWallet size={22} />, t: "Paga como prefieras", d: "Efectivo, transferencia, Addi, Sistecrédito" },
          ].map((x) => (
            <div key={x.t} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-electric-500/10 text-electric-600">{x.i}</span>
              <div><p className="text-sm font-semibold">{x.t}</p><p className="text-xs text-muted">{x.d}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* ASESOR */}
      <section className="container-x py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-sm font-semibold tracking-wide text-electric-600 uppercase">Asesor JUDAH</p>
            <h2 className="text-3xl font-medium sm:text-4xl">No necesitas saber de tecnología. Solo cuéntanos qué necesitas.</h2>
            <p className="text-lg text-muted">Nuestro asesor con inteligencia artificial te escucha, consulta el catálogo y te explica cada opción con palabras simples. No te presiona: te ayuda a tomar una buena decisión.</p>
            <div className="flex flex-wrap gap-3">
              <AskAdvisorButton label="Hablar con el asesor" />
              <Link href="/asesor" className="btn-outline">Abrir en pantalla completa</Link>
            </div>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {STEPS.map((s) => (
              <li key={s.n} className="card p-5">
                <span className="font-display grid h-10 w-10 place-items-center rounded-xl bg-navy-900 text-lg text-brand-cyan">{s.n}</span>
                <h3 className="mt-4 text-lg font-medium">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="container-x">
        <h2 className="mb-6 text-2xl font-medium">Explora por categoría</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link key={c.href} href={c.href} className="card group flex flex-col items-center gap-3 p-4 transition hover:border-electric-400/50">
              <Image src={c.img} alt="" width={140} height={140} className="h-24 w-24 rounded-xl object-contain transition group-hover:scale-105 sm:h-28 sm:w-28" />
              <span className="text-sm font-semibold">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="container-x py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium">Celulares para cada necesidad</h2>
            <p className="mt-1 text-sm text-muted">Precios y existencias de demostración.</p>
          </div>
          <Link href="/catalogo?categoria=celulares" className="hidden items-center gap-1 text-sm font-semibold text-electric-600 hover:underline sm:inline-flex">Ver todos <IconArrowRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* COMPARAR + ACCESORIOS */}
      <section className="container-x grid gap-4 lg:grid-cols-2">
        <div className="hero-glow relative overflow-hidden rounded-3xl p-8 text-white">
          <div className="hex-pattern absolute inset-0" aria-hidden />
          <div className="relative space-y-4">
            <IconCompare size={32} className="text-brand-cyan" />
            <h2 className="text-2xl font-medium">¿Dudas entre dos o tres modelos?</h2>
            <p className="text-white/70">Ponlos lado a lado, dinos qué es lo más importante para ti y te decimos cuál se ajusta mejor.</p>
            <Link href="/comparar" className="btn-cyan">Ir al comparador</Link>
          </div>
        </div>
        <div className="card flex flex-col gap-5 p-8">
          <div>
            <h2 className="text-2xl font-medium">Completa tu compra</h2>
            <p className="mt-1 text-muted">Audífonos, cargadores, fundas y más. El asesor solo te sugiere accesorios con compatibilidad verificada.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {accessories.map((p) => <ProductCard key={p.id} p={p} compact />)}
          </div>
        </div>
      </section>
    </>
  );
}
