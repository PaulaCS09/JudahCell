import "server-only";
import {
  getAccessoryCompatibility, getCompatibleAccessories, getPhones, getProduct, getProductsByIds, getSettings, listProducts,
} from "../catalog";
import type { Product } from "../db/schema";
import { recommendPhones, type NeedsProfile, type Role } from "../recommend";
import { needsProfileSchema } from "../validation";

/** Tarjetas que el frontend dibuja junto a la respuesta. Siempre con datos de la BD, nunca del modelo. */
export type ChatCard =
  | { type: "recommendations"; items: { product: Product; role?: Role; reasons: string[]; limitations: string[]; overBudget: boolean }[]; note?: string }
  | { type: "accessories"; phoneId: string; phoneName: string; items: (Product & { compatNote: string | null })[] }
  | { type: "products"; items: Product[] };

export type ToolState = { profile: NeedsProfile; cards: ChatCard[] };

/** Declaraciones de funciones para Gemini (subset de OpenAPI). */
export const toolDeclarations = [
  {
    name: "actualizar_perfil",
    description:
      "Guarda lo que vas entendiendo de las necesidades del cliente. Llámala cada vez que el cliente dé un dato nuevo (presupuesto, usos, importancia de cámara/batería/rendimiento, almacenamiento, marcas, requisitos). Solo envía los campos nuevos o que cambian.",
    parameters: {
      type: "object",
      properties: {
        budgetMaxCop: { type: "integer", description: "Presupuesto máximo en pesos colombianos (ej. 'un millón' = 1000000)." },
        uses: { type: "array", items: { type: "string", enum: ["basico", "redes", "fotos", "video", "juegos", "trabajo", "estudio"] } },
        cameraImportance: { type: "integer", description: "0 no importa, 1 normal, 2 importante, 3 muy importante" },
        batteryImportance: { type: "integer", description: "0 no importa, 1 normal, 2 importante, 3 muy importante" },
        performanceImportance: { type: "integer", description: "0 no importa, 1 normal, 2 importante, 3 muy importante" },
        storageMinGb: { type: "integer", description: "Almacenamiento mínimo en GB" },
        preferredBrands: { type: "array", items: { type: "string" } },
        avoidedBrands: { type: "array", items: { type: "string" } },
        mustHave: { type: "array", items: { type: "string", enum: ["5g", "amoled", "estabilizacion", "carga_rapida", "256gb"] } },
      },
    },
  },
  {
    name: "recomendar_celulares",
    description:
      "Ejecuta el motor de recomendaciones con el perfil actual del cliente sobre el catálogo real y devuelve de 2 a 3 celulares con rol (mejor opción, alternativa económica, mayores prestaciones), razones y limitaciones. Las tarjetas se muestran automáticamente al cliente.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "buscar_catalogo",
    description: "Busca productos en el catálogo con filtros. Úsala para responder sobre disponibilidad, precios o para encontrar productos concretos.",
    parameters: {
      type: "object",
      properties: {
        texto: { type: "string", description: "Texto libre: marca, modelo o característica" },
        categoria: { type: "string", enum: ["celulares", "accesorios", "audifonos", "cargadores", "proteccion", "otros"] },
        marca: { type: "string" },
        precio_min: { type: "integer" },
        precio_max: { type: "integer" },
        almacenamiento_min_gb: { type: "integer" },
        solo_5g: { type: "boolean" },
      },
    },
  },
  {
    name: "ver_producto",
    description: "Devuelve la ficha técnica completa y verificada de un producto por su id.",
    parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "accesorios_compatibles",
    description:
      "Devuelve SOLO los accesorios cuya compatibilidad con ese celular está verificada en la base de datos. Las tarjetas se muestran automáticamente. Nunca sugieras accesorios que no aparezcan aquí.",
    parameters: { type: "object", properties: { celular_id: { type: "string" } }, required: ["celular_id"] },
  },
  {
    name: "mostrar_productos",
    description: "Muestra al cliente tarjetas de productos específicos (máximo 4) para que pueda verlos, compararlos o agregarlos al carrito.",
    parameters: { type: "object", properties: { ids: { type: "array", items: { type: "string" } } }, required: ["ids"] },
  },
  {
    name: "condiciones_tienda",
    description:
      "Consulta condiciones oficiales del negocio: garantía, medios de pago, entregas y datos del punto físico. Si un valor viene como null significa que NO está configurado y no debes inventarlo.",
    parameters: {
      type: "object",
      properties: { tema: { type: "string", enum: ["garantia", "pagos", "entregas", "tienda", "todo"] } },
      required: ["tema"],
    },
  },
] as const;

function summary(p: Product) {
  return {
    id: p.id,
    nombre: p.brand.startsWith("Genérico") ? p.model : `${p.brand} ${p.model}`,
    categoria: p.categoryId,
    precio_cop: p.priceCop,
    disponibles: p.stock,
    ram_gb: p.ramGb,
    almacenamiento_gb: p.storageGb,
    camara: p.cameraSummary,
    bateria_mah: p.batteryMah,
    pantalla: p.screen,
    "5g": p.has5g,
    rendimiento_1a5: p.performanceScore,
  };
}

function full(p: Product) {
  return {
    ...summary(p),
    marca: p.brand,
    modelo: p.model,
    descripcion: p.description,
    procesador: p.processor,
    camara_principal_mp: p.mainCameraMp,
    calificacion_camara_1a5: p.cameraScore,
    calificacion_bateria_1a5: p.batteryScore,
    conector: p.connector,
    destacados: p.highlights,
    colores: p.colors,
    garantia_meses: p.warrantyMonths ?? "no confirmada para este producto",
    dato_de_demostracion: p.isDemo,
  };
}

export async function runTool(name: string, args: Record<string, unknown>, state: ToolState): Promise<unknown> {
  switch (name) {
    case "actualizar_perfil": {
      const merged = { ...state.profile, ...args };
      const parsed = needsProfileSchema.safeParse(merged);
      if (!parsed.success) return { ok: false, error: "Datos de perfil no válidos", detalle: parsed.error.issues.map((i) => i.message) };
      state.profile = parsed.data;
      return { ok: true, perfil: state.profile };
    }
    case "recomendar_celulares": {
      const phones = await getPhones();
      const r = recommendPhones(phones, state.profile, 3);
      const byId = new Map(phones.map((p) => [p.id, p]));
      state.cards.push({
        type: "recommendations",
        note: r.note,
        items: r.results.map((x) => ({ product: byId.get(x.id)!, role: x.role, reasons: x.reasons, limitations: x.limitations, overBudget: x.overBudget })),
      });
      return {
        perfil_usado: state.profile,
        recomendaciones: r.results.map((x) => ({ ...full(byId.get(x.id)!), rol: x.role ?? null, puntaje: x.score, razones: x.reasons, limitaciones: x.limitations, fuera_de_presupuesto: x.overBudget })),
        descartados: r.excluded,
        nota: r.note ?? null,
        aviso: "Las tarjetas con estos productos ya se muestran al cliente; no repitas toda la ficha.",
      };
    }
    case "buscar_catalogo": {
      const list = await listProducts({
        q: typeof args.texto === "string" ? args.texto : undefined,
        category: typeof args.categoria === "string" ? args.categoria : undefined,
        brands: typeof args.marca === "string" ? [args.marca] : undefined,
        minPrice: typeof args.precio_min === "number" ? args.precio_min : undefined,
        maxPrice: typeof args.precio_max === "number" ? args.precio_max : undefined,
        minStorageGb: typeof args.almacenamiento_min_gb === "number" ? args.almacenamiento_min_gb : undefined,
        only5g: args.solo_5g === true,
        limit: 15,
      });
      // Búsqueda tolerante: si la marca no coincide exacto, reintentar como texto
      const result = list.length || typeof args.marca !== "string" ? list : await listProducts({ q: args.marca as string, limit: 15 });
      return { total: result.length, productos: result.map(summary) };
    }
    case "ver_producto": {
      const p = await getProduct(String(args.id ?? ""));
      if (!p) return { error: "Producto no encontrado en el catálogo" };
      const compat = p.categoryId === "celulares" ? undefined : await getAccessoryCompatibility(p.id);
      return { ...full(p), compatible_con: compat?.map((c) => c.id) };
    }
    case "accesorios_compatibles": {
      const phone = await getProduct(String(args.celular_id ?? ""));
      if (!phone || phone.categoryId !== "celulares") return { error: "Celular no encontrado" };
      const acc = await getCompatibleAccessories(phone.id);
      const phoneName = `${phone.brand} ${phone.model}`;
      if (acc.length) state.cards.push({ type: "accessories", phoneId: phone.id, phoneName, items: acc.slice(0, 8) });
      return {
        celular: phoneName,
        accesorios_verificados: acc.map((a) => ({ ...summary(a), nota_compatibilidad: a.compatNote })),
        aviso: acc.length ? "Las tarjetas ya se muestran al cliente." : "No hay accesorios con compatibilidad verificada para este celular.",
      };
    }
    case "mostrar_productos": {
      const ids = Array.isArray(args.ids) ? args.ids.map(String).slice(0, 4) : [];
      const list = await getProductsByIds(ids);
      if (list.length) state.cards.push({ type: "products", items: list });
      return { mostrados: list.map((p) => p.id), no_encontrados: ids.filter((id) => !list.some((p) => p.id === id)) };
    }
    case "condiciones_tienda": {
      const s = await getSettings();
      const tema = String(args.tema ?? "todo");
      const out: Record<string, unknown> = {};
      if (tema === "garantia" || tema === "todo") out.garantia = s.warranty;
      if (tema === "pagos" || tema === "todo") out.medios_de_pago = s.payment_methods;
      if (tema === "entregas" || tema === "todo")
        out.entregas = {
          ...s.delivery,
          tarifas_domicilio: s.delivery.rates ?? "NO CONFIGURADAS: el costo depende de la ubicación y lo confirma un asesor de JUDAH CELL.",
          tiempos_estimados: s.delivery.estimated_times ?? "NO CONFIGURADOS: no prometer tiempos.",
        };
      if (tema === "tienda" || tema === "todo")
        out.tienda = {
          nombre: s.store_name, ciudad: s.city,
          direccion: s.store_address ?? "NO CONFIGURADA",
          horario: s.store_hours ?? "NO CONFIGURADO",
          whatsapp: s.whatsapp ?? "NO CONFIGURADO",
        };
      return out;
    }
    default:
      return { error: `Herramienta desconocida: ${name}` };
  }
}
