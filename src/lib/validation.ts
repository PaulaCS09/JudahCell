import { z } from "zod";
import { MUST_HAVES, USES } from "./recommend";

const importance = z.number().int().min(0).max(3).nullable().optional();

export const needsProfileSchema = z
  .object({
    budgetMaxCop: z.number().int().min(0).max(50_000_000).nullable().optional(),
    uses: z.array(z.enum(USES)).max(7).optional(),
    cameraImportance: importance,
    batteryImportance: importance,
    performanceImportance: importance,
    storageMinGb: z.number().int().min(0).max(2048).nullable().optional(),
    preferredBrands: z.array(z.string().max(40)).max(10).optional(),
    avoidedBrands: z.array(z.string().max(40)).max(10).optional(),
    mustHave: z.array(z.enum(MUST_HAVES)).max(5).optional(),
  })
  .strict();

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(40),
  profile: needsProfileSchema.default({}),
  context: z
    .object({
      page: z.string().max(120).optional(),
      productId: z.string().max(60).optional(),
      cartProductIds: z.array(z.string().max(60)).max(30).optional(),
      compareProductIds: z.array(z.string().max(60)).max(3).optional(),
    })
    .optional(),
});

const phoneRegex = /^3\d{9}$/; // celular colombiano: 10 dígitos iniciando en 3

export const orderRequestSchema = z
  .object({
    customerName: z.string().trim().min(3, "Escribe tu nombre completo").max(80),
    phone: z.string().trim().transform((s) => s.replace(/[\s-]/g, "").replace(/^\+?57/, "")).pipe(z.string().regex(phoneRegex, "Escribe un celular colombiano válido (10 dígitos, inicia en 3)")),
    email: z.union([z.literal(""), z.string().trim().email("Correo no válido").max(120)]).optional(),
    deliveryMode: z.enum(["pickup", "delivery"]),
    address: z.string().trim().max(160).optional(),
    locality: z.string().trim().max(60).optional(),
    paymentMethod: z.enum(["efectivo", "transferencia", "addi", "sistecredito"]),
    notes: z.string().trim().max(300).optional(),
    items: z
      .array(z.object({ productId: z.string().max(60), quantity: z.number().int().min(1).max(5) }))
      .min(1, "El carrito está vacío")
      .max(20),
    acceptsDataPolicy: z.literal(true, { message: "Debes aceptar el tratamiento de datos" }),
  })
  .superRefine((o, ctx) => {
    if (o.deliveryMode === "delivery" && (!o.address || o.address.length < 6)) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "Escribe la dirección de entrega" });
    }
  });

export const orderLookupSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^JC-[A-Z0-9]{6}$/, "Código no válido"),
  phone: z.string().trim().transform((s) => s.replace(/[\s-]/g, "").replace(/^\+?57/, "")).pipe(z.string().regex(phoneRegex, "Celular no válido")),
});
