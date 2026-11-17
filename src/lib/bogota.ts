/** Las 20 localidades de Bogotá D.C. */
export const BOGOTA_LOCALITIES = [
  "Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme", "Tunjuelito", "Bosa", "Kennedy", "Fontibón", "Engativá",
  "Suba", "Barrios Unidos", "Teusaquillo", "Los Mártires", "Antonio Nariño", "Puente Aranda", "La Candelaria",
  "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz",
];

export const PAYMENT_LABEL: Record<string, string> = { efectivo: "Efectivo", transferencia: "Transferencia", addi: "Addi", sistecredito: "Sistecrédito" };

export const STATUS_STEPS = [
  { id: "recibido", label: "Solicitud recibida" },
  { id: "confirmado", label: "Confirmado por un asesor" },
  { id: "en_camino", label: "En camino / listo para recoger" },
  { id: "entregado", label: "Entregado" },
] as const;
