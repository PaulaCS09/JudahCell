import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AdvisorDrawer } from "@/components/advisor/AdvisorDrawer";
import { DemoBar, Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { Toasts } from "@/components/Toasts";

export const metadata: Metadata = {
  title: { default: "JUDAH CELL · Celulares y accesorios en Bogotá", template: "%s · JUDAH CELL" },
  description: "Encuentra el celular que realmente necesitas con la ayuda del Asesor JUDAH. Celulares y accesorios originales en Bogotá, garantía de 6 meses.",
  icons: { icon: "/brand/logo-mark.png", apple: "/brand/apple-icon.png" },
};

export const viewport: Viewport = { themeColor: "#040a1c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body className="flex min-h-dvh flex-col">
        <a href="#contenido" className="sr-only z-50 rounded bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">Saltar al contenido</a>
        <StoreProvider>
          <DemoBar />
          <Header />
          <main id="contenido" className="flex-1">{children}</main>
          <Footer />
          <AdvisorDrawer />
          <Toasts />
        </StoreProvider>
      </body>
    </html>
  );
}
