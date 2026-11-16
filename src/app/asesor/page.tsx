import type { Metadata } from "next";
import { AdvisorPage } from "@/components/advisor/AdvisorPage";

export const metadata: Metadata = { title: "Asesor inteligente" };

export default function Page() {
  return <AdvisorPage />;
}
