import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "Finalizar compra" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await getSettings();
  return <CheckoutForm payments={s.payment_methods} delivery={s.delivery} storeAddress={s.store_address} />;
}
