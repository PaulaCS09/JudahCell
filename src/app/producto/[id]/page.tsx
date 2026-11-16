import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoBadge } from "@/components/Brand";
import { AskAdvisorButton } from "@/components/HeroAsk";
import { IconBattery, IconCamera, IconCheck, IconChip, IconShield, IconStorage } from "@/components/Icons";
import { ProductActions } from "@/components/ProductActions";
import { ProductCard, StockLabel } from "@/components/ProductCard";
import { getAccessoryCompatibility, getCompatibleAccessories, getProduct } from "@/lib/catalog";
import { formatCOP, PERFORMANCE_LABEL, productName, storageLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).id);
  return { title: p ? productName(p) : "Producto no encontrado" };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) notFound();
  const isPhone = p.categoryId === "celulares";
  const [accessories, compatibleWith] = await Promise.all([
    isPhone ? getCompatibleAccessories(p.id) : Promise.resolve([]),
    isPhone ? Promise.resolve([]) : getAccessoryCompatibility(p.id),
  ]);

  const specs: { icon: React.ReactNode; label: string; value: string | null }[] = isPhone
    ? [
        { icon: <IconStorage />, label: "Almacenamiento", value: storageLabel(p.storageGb) },
        { icon: <IconChip />, label: "Memoria RAM", value: p.ramGb ? `${p.ramGb} GB` : null },
        { icon: <IconCamera />, label: "Cámara", value: p.cameraSummary },
        { icon: <IconBattery />, label: "Batería", value: p.batteryMah ? `${p.batteryMah} mAh` : "El fabricante no publica la capacidad en mAh" },
        { icon: <IconChip />, label: "Procesador", value: p.processor },
        { icon: <IconChip />, label: "Rendimiento (referencia)", value: p.performanceScore ? PERFORMANCE_LABEL[p.performanceScore] : null },
      ]
    : [{ icon: <IconChip />, label: "Conexión", value: p.connector }];

  return (
    <div className="container-x py-8 sm:py-12">
      <nav aria-label="Ruta" className="mb-5 text-xs text-muted">
        <Link href="/" className="hover:text-ink">Inicio</Link> / <Link href={`/catalogo?categoria=${isPhone ? "celulares" : "accesorios"}`} className="hover:text-ink">{isPhone ? "Celulares" : "Accesorios"}</Link> / <span>{productName(p)}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="card relative h-fit overflow-hidden lg:sticky lg:top-24">
          <Image src={p.image} alt={productName(p)} width={800} height={800} priority className="aspect-square w-full object-contain p-8" />
          <div className="absolute top-4 left-4 flex gap-2">{p.isDemo && <DemoBadge label="Producto de demostración" />}</div>
          {p.imageIsIllustration && <p className="absolute right-4 bottom-3 text-xs text-muted">Imagen ilustrativa</p>}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold tracking-wide text-electric-600 uppercase">{p.brand}</p>
            <h1 className="mt-1 text-3xl font-medium sm:text-4xl">{p.model}</h1>
            <p className="mt-3 text-muted">{p.description}</p>
          </div>
          <div className="flex items-end gap-4">
            <p className="text-3xl font-bold">{formatCOP(p.priceCop)}</p>
            <div className="pb-1"><StockLabel stock={p.stock} /></div>
          </div>
          {p.isDemo && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Precio, existencias y especificaciones de demostración. No corresponden al inventario real de JUDAH CELL.</p>}

          <ProductActions p={p} />

          {p.highlights.length > 0 && (
            <ul className="space-y-2">
              {p.highlights.map((h) => <li key={h} className="flex items-center gap-2 text-sm"><IconCheck size={18} className="text-emerald-600" />{h}</li>)}
            </ul>
          )}

          <dl className="grid gap-2 sm:grid-cols-2">
            {specs.filter((s) => s.value).map((s) => (
              <div key={s.label} className="flex gap-3 rounded-xl border border-line bg-white p-3">
                <span className="text-electric-500">{s.icon}</span>
                <div><dt className="text-xs text-muted">{s.label}</dt><dd className="text-sm font-medium">{s.value}</dd></div>
              </div>
            ))}
            {isPhone && p.screen && <div className="flex gap-3 rounded-xl border border-line bg-white p-3 sm:col-span-2"><span className="text-electric-500"><IconChip /></span><div><dt className="text-xs text-muted">Pantalla · Red</dt><dd className="text-sm font-medium">{p.screen} · {p.has5g ? "5G" : "4G"}</dd></div></div>}
          </dl>

          <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
            <IconShield className="mt-0.5 shrink-0 text-electric-600" />
            <div className="text-sm">
              {p.warrantyMonths ? (
                <><p className="font-semibold">Garantía de {p.warrantyMonths} meses por funcionamiento</p><p className="text-muted">Se requiere el recibo de compra. <Link href="/garantia-y-entregas#garantia" className="text-electric-600 hover:underline">Ver condiciones</Link></p></>
              ) : (
                <p className="text-muted">Garantía de este accesorio: <strong className="text-ink">por confirmar</strong> con un asesor de JUDAH CELL.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-navy-900 p-5 text-white">
            <p className="font-display text-lg">¿Es el indicado para ti?</p>
            <p className="mt-1 text-sm text-white/70">Pregúntale al Asesor JUDAH. Conoce esta ficha y el resto del catálogo.</p>
            <AskAdvisorButton label="Preguntar sobre este producto" prompt={`¿El ${productName(p)} es una buena opción para mí? Ayúdame a decidir.`} className="btn-cyan mt-4" />
          </div>

          {!isPhone && compatibleWith.length > 0 && (
            <div>
              <p className="label">Compatible con (verificado)</p>
              <div className="flex flex-wrap gap-1.5">{compatibleWith.map((c) => <Link key={c.id} href={`/producto/${c.id}`} className="chip hover:border-electric-400">{c.brand} {c.model}</Link>)}</div>
            </div>
          )}
        </div>
      </div>

      {accessories.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-medium">Accesorios compatibles</h2>
          <p className="mt-1 mb-6 text-sm text-muted">Solo mostramos accesorios con compatibilidad verificada para el {productName(p)}.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {accessories.map((a) => <ProductCard key={a.id} p={a} compact />)}
          </div>
        </section>
      )}
    </div>
  );
}
