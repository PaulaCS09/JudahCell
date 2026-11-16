import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderLookup } from "@/components/OrderLookup";

export const metadata: Metadata = { title: "Mis pedidos" };

export default function Page() {
  return (
    <div className="container-x max-w-3xl py-8 sm:py-12">
      <h1 className="text-3xl font-medium sm:text-4xl">Mis pedidos</h1>
      <p className="mt-2 text-muted">Consulta el estado de tu compra con el código del pedido y el celular que registraste. No necesitas crear una cuenta.</p>
      <Suspense><OrderLookup /></Suspense>
    </div>
  );
}
