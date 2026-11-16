import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <p className="font-display text-6xl text-electric-500">404</p>
      <h1 className="mt-3 text-2xl font-medium">No encontramos esta página</h1>
      <p className="mt-2 text-muted">Puede que el producto ya no esté disponible.</p>
      <Link href="/catalogo" className="btn-primary mt-6">Ir al catálogo</Link>
    </div>
  );
}
