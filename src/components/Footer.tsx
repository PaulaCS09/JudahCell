import Link from "next/link";
import { Logo } from "./Brand";

export function Footer() {
  return (
    <footer className="hex-pattern mt-20 bg-navy-950 text-white/70">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed">Celulares y accesorios originales en Bogotá, con asesoría personalizada para que compres con confianza.</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Tienda</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/catalogo?categoria=celulares">Celulares</Link></li>
            <li><Link className="hover:text-white" href="/catalogo?categoria=accesorios">Accesorios</Link></li>
            <li><Link className="hover:text-white" href="/comparar">Comparar celulares</Link></li>
            <li><Link className="hover:text-white" href="/asesor">Asesor inteligente</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Compra segura</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/garantia-y-entregas#garantia">Garantía de 6 meses</Link></li>
            <li><Link className="hover:text-white" href="/garantia-y-entregas#entregas">Entregas en Bogotá</Link></li>
            <li><Link className="hover:text-white" href="/garantia-y-entregas#pagos">Medios de pago</Link></li>
            <li><Link className="hover:text-white" href="/pedidos">Mis pedidos</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Contacto</h3>
          <p className="text-sm">Bogotá, Colombia</p>
          <p className="mt-2 text-sm text-white/45">Dirección, horario y WhatsApp: pendientes de configurar.</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-white/45 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} JUDAH CELL · Prototipo MVP</p>
          <p>Productos, precios, existencias y pedidos mostrados son datos de demostración.</p>
        </div>
      </div>
    </footer>
  );
}

export function DemoBar() {
  return (
    <div className="bg-amber-100 text-amber-900">
      <p className="container-x py-1.5 text-center text-xs font-medium">
        Prototipo de demostración: los productos, precios y existencias son <strong>ficticios</strong>. No se realizan cobros.
      </p>
    </div>
  );
}
