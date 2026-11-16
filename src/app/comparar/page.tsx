import type { Metadata } from "next";
import { Comparator } from "@/components/Comparator";
import { getPhones } from "@/lib/catalog";

export const metadata: Metadata = { title: "Comparar celulares" };
export const dynamic = "force-dynamic";

export default async function CompararPage() {
  const phones = await getPhones();
  return (
    <div className="container-x py-8 sm:py-12">
      <h1 className="text-3xl font-medium sm:text-4xl">Comparar celulares</h1>
      <p className="mt-2 max-w-2xl text-muted">Elige hasta tres celulares, marca lo que más te importa y te mostramos cuál se ajusta mejor a ti. Datos de demostración.</p>
      <Comparator phones={phones} />
    </div>
  );
}
