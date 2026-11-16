import { NextResponse } from "next/server";
import { getProductsByIds, listProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/** Lectura pública del catálogo. ?ids=a,b,c o filtros ?q=&category=&brand= */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const ids = sp.get("ids");
  if (ids) {
    const list = ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 30);
    return NextResponse.json({ products: await getProductsByIds(list) });
  }
  const num = (k: string) => (sp.get(k) && !isNaN(Number(sp.get(k))) ? Number(sp.get(k)) : undefined);
  const products = await listProducts({
    q: sp.get("q")?.slice(0, 80) ?? undefined,
    category: sp.get("category") ?? undefined,
    brands: sp.getAll("brand").slice(0, 10),
    minPrice: num("min"),
    maxPrice: num("max"),
    limit: Math.min(num("limit") ?? 50, 100),
  });
  return NextResponse.json({ products });
}
