# Cómo sustituir los datos de prueba por datos reales

La aplicación no necesita cambios de código. Todo el catálogo y la configuración del negocio se cargan desde un archivo JSON.

## Pasos

1. Copia la plantilla:
   ```bash
   cp db/seed/catalog.demo.json db/seed/catalog.real.json
   ```
2. Edita `catalog.real.json`:
   - **`categories`**: déjalas como están o agrega otras. `kind` debe ser `phone` o `accessory`.
   - **`products`**: un objeto por producto. Campos:

     | Campo | Obligatorio | Notas |
     |---|---|---|
     | `id` | ✅ | Identificador único y estable, en minúsculas y con guiones (aparece en la URL) |
     | `categoryId` | ✅ | Id de la categoría |
     | `brand`, `model`, `description` | ✅ | |
     | `priceCop` | ✅ | Pesos colombianos, sin puntos ni decimales (ej. `1299900`) |
     | `stock` | ✅ | Unidades disponibles |
     | `image` | ✅ | Ruta en `public/` (ej. `/products/galaxy-a37.webp`) |
     | `ramGb`, `storageGb`, `mainCameraMp`, `cameraSummary`, `batteryMah`, `screen`, `processor`, `has5g`, `connector` | Celulares | `null` si no aplica o no se conoce |
     | `performanceScore`, `cameraScore`, `batteryScore` | Celulares | Calificación interna de 1 a 5. **Alimenta el motor de recomendaciones y el comparador.** La define JUDAH CELL. |
     | `highlights` | | Lista de diferenciales |
     | `colors` | | Lista de colores |
     | `warrantyMonths` | | `6` cuando la garantía está confirmada; `null` = "por confirmar" |
     | `imageIsIllustration` | | `true` si la imagen es ilustrativa |

   - **`compatibilities`**: solo compatibilidades **verificadas**. `phoneIds` puede ser una lista de ids, `"ALL_PHONES"` (todos los celulares) o `"ALL_USB_C"` (celulares con `connector: "USB-C"`).
   - **`settings`**: dirección, horario, WhatsApp, garantía, medios de pago y entregas. Para activar el cálculo de domicilio:
     ```json
     "rates": [ { "locality": "Chapinero", "costCop": 12000 }, { "locality": "Suba", "costCop": 15000 } ],
     "estimated_times": "Mismo día si pides antes de las 2:00 p. m."
     ```
     Las localidades deben escribirse igual que en `src/lib/bogota.ts`.
   - **`demoOrders`**: bórralo o déjalo vacío (`[]`).
3. Copia las fotos reales a `public/products/`. Se recomienda formato `.webp`, cuadrado y con fondo blanco.
4. Carga el catálogo:
   ```bash
   npm run db:reset -- --catalog db/seed/catalog.real.json
   ```
   Al cargar un archivo distinto al de demostración, los productos quedan con `isDemo = false`.
5. Quita los avisos de demostración globales: el componente `DemoBar` en `src/components/Footer.tsx`, la frase del pie de página y "Datos de demostración" en el catálogo.

> ⚠️ `db:reset` **borra los pedidos**. Si ya hay pedidos reales, actualiza los productos con SQL o con un panel administrativo, sin hacer reset.

## Actualizar precios o existencias sin reiniciar

```sql
UPDATE products SET price_cop = 1249900, stock = 4 WHERE id = 'galaxy-a37';
```
Puedes ejecutarlo con `sqlite3 data/judah.db` en local o en la consola de Turso en producción.
