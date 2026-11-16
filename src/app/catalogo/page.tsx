import type { Metadata } from "next";
import Link from "next/link";
import { AskAdvisorButton } from "@/components/HeroAsk";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, listProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Catálogo" };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const num = (v: string) => (v && !isNaN(Number(v)) && Number(v) >= 0 ? Number(v) : undefined);

export default async function Catalogo({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const categoria = one(sp.categoria);
  const q = one(sp.q).slice(0, 80);
  const brands = many(sp.marca).slice(0, 10);
  const filters = {
    q: q || undefined,
    category: categoria || undefined,
    brands,
    minPrice: num(one(sp.min)),
    maxPrice: num(one(sp.max)),
    minStorageGb: num(one(sp.almacenamiento)),
    minRamGb: num(one(sp.ram)),
    only5g: one(sp.g5) === "1",
    inStock: one(sp.disponible) === "1",
    sort: (["precio_asc", "precio_desc"].includes(one(sp.orden)) ? one(sp.orden) : "relevancia") as "relevancia" | "precio_asc" | "precio_desc",
  };

  const [products, categories, allInCategory] = await Promise.all([
    listProducts(filters),
    getCategories(),
    listProducts({ category: categoria || undefined }),
  ]);
  const brandOptions = [...new Set(allInCategory.map((p) => p.brand))].sort();
  const isPhones = categoria === "celulares";
  const title = categoria === "accesorios" ? "Accesorios" : categories.find((c) => c.id === categoria)?.name ?? "Todos los productos";
  const activeCount = brands.length + [filters.minPrice, filters.maxPrice, filters.minStorageGb, filters.minRamGb].filter((x) => x != null).length + Number(filters.only5g) + Number(filters.inStock);

  const filterForm = (
    <form method="get" className="space-y-6">
      {q && <input type="hidden" name="q" value={q} />}
      <fieldset>
        <legend className="label">Categoría</legend>
        <div className="space-y-1.5 text-sm">
          {[{ id: "", name: "Todos" }, { id: "celulares", name: "Celulares" }, { id: "accesorios", name: "Todos los accesorios" }, ...categories.filter((c) => c.kind === "accessory")].map((c) => (
            <label key={c.id || "all"} className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="categoria" value={c.id} defaultChecked={categoria === c.id} className="accent-electric-500" /> {c.name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Marca</legend>
        <div className="space-y-1.5 text-sm">
          {brandOptions.map((b) => (
            <label key={b} className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" name="marca" value={b} defaultChecked={brands.includes(b)} className="accent-electric-500" /> {b}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Precio (COP)</legend>
        <div className="flex gap-2">
          <input name="min" inputMode="numeric" placeholder="Mínimo" defaultValue={one(sp.min)} className="input py-2" aria-label="Precio mínimo" />
          <input name="max" inputMode="numeric" placeholder="Máximo" defaultValue={one(sp.max)} className="input py-2" aria-label="Precio máximo" />
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Características</legend>
        <div className="space-y-2 text-sm">
          <select name="almacenamiento" defaultValue={one(sp.almacenamiento)} className="input py-2" aria-label="Almacenamiento mínimo">
            <option value="">Almacenamiento: cualquiera</option>
            <option value="128">128 GB o más</option>
            <option value="256">256 GB o más</option>
          </select>
          <select name="ram" defaultValue={one(sp.ram)} className="input py-2" aria-label="RAM mínima">
            <option value="">RAM: cualquiera</option>
            <option value="6">6 GB o más</option>
            <option value="8">8 GB o más</option>
          </select>
          <label className="flex items-center gap-2"><input type="checkbox" name="g5" value="1" defaultChecked={filters.only5g} className="accent-electric-500" /> Con 5G</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="disponible" value="1" defaultChecked={filters.inStock} className="accent-electric-500" /> Solo disponibles</label>
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Ordenar</legend>
        <select name="orden" defaultValue={filters.sort} className="input py-2">
          <option value="relevancia">Recomendado</option>
          <option value="precio_asc">Menor precio</option>
          <option value="precio_desc">Mayor precio</option>
        </select>
      </fieldset>
      <div className="flex gap-2">
        <button className="btn-primary flex-1">Aplicar filtros</button>
        <Link href={categoria ? `/catalogo?categoria=${categoria}` : "/catalogo"} className="btn-outline">Limpiar</Link>
      </div>
    </form>
  );

  return (
    <div className="container-x py-8 sm:py-12">
      <nav aria-label="Ruta" className="mb-3 text-xs text-muted"><Link href="/" className="hover:text-ink">Inicio</Link> / <span>Catálogo</span></nav>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium sm:text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">
            {q ? <>Resultados para “{q}” · </> : null}{products.length} producto{products.length === 1 ? "" : "s"} · <span className="font-medium text-amber-700">Datos de demostración</span>
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <details className="card p-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold">Filtros {activeCount > 0 && <span className="ml-1 rounded-full bg-electric-500 px-2 text-xs text-white">{activeCount}</span>}</summary>
            <div className="pt-4">{filterForm}</div>
          </details>
          <div className="card sticky top-24 hidden p-5 lg:block">{filterForm}</div>
        </aside>

        <div className="space-y-6">
          {(isPhones || !categoria) && (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-electric-400/25 bg-electric-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm"><strong>¿No sabes cuál elegir?</strong> Cuéntale al Asesor JUDAH para qué lo necesitas y te recomienda 2 o 3 opciones.</p>
              <AskAdvisorButton label="Pedir recomendación" className="btn-primary shrink-0 py-2.5" />
            </div>
          )}
          {products.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          ) : (
            <div className="card p-10 text-center">
              <p className="text-lg font-medium">No encontramos productos con esos filtros.</p>
              <p className="mt-1 text-sm text-muted">Prueba quitando algún filtro o pregúntale al asesor.</p>
              <div className="mt-5 flex justify-center gap-2">
                <Link href="/catalogo" className="btn-outline">Ver todo</Link>
                <AskAdvisorButton label="Preguntar al asesor" prompt={q ? `Estoy buscando: ${q}` : undefined} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
