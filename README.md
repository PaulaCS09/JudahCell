# JUDAH CELL · MVP con Asesor JUDAH (IA)

Tienda web de celulares y accesorios para **JUDAH CELL** (Bogotá, Colombia), con un asesor de compras basado en inteligencia artificial que escucha al cliente, consulta el catálogo y recomienda opciones justificadas.

> ⚠️ **Prototipo.** Productos, precios, existencias y pedidos son **datos de demostración**. No se realizan cobros.

---

## 1. Qué incluye

| Módulo | Ruta | Estado |
|---|---|---|
| Inicio con buscador, presentación del asesor y categorías | `/` | ✅ Funcional |
| Catálogo con filtros (categoría, marca, precio, almacenamiento, RAM, 5G, disponibilidad, orden) | `/catalogo` | ✅ Funcional |
| Ficha de producto + accesorios con compatibilidad verificada | `/producto/[id]` | ✅ Funcional |
| **Asesor JUDAH** (IA real con Gemini + herramientas sobre el catálogo) | `/asesor` y panel en todas las páginas | ✅ Funcional (requiere `GEMINI_API_KEY`) |
| Modo guiado sin IA (respaldo si la IA falla) | dentro del asesor | ✅ Funcional |
| Comparador de hasta 3 celulares con conclusión según prioridades | `/comparar` | ✅ Funcional |
| Carrito (agregar, quitar, cantidades, subtotales, accesorios) | `/carrito` | ✅ Funcional |
| Checkout demostrativo (datos, entrega, medio de pago) → solicitud de pedido | `/checkout` | ✅ Funcional, sin cobros |
| Garantía, entregas y medios de pago | `/garantia-y-entregas` | ✅ Funcional |
| Seguimiento de pedidos (código + celular, sin registro) | `/pedidos` | ✅ Funcional |

Pedidos de prueba: **JC-DEMO01** y **JC-DEMO02** con el celular **3000000000**.

## 2. Arquitectura

```
Navegador (Next.js / React, responsive)
   │  carrito, comparador y conversación en localStorage/sessionStorage (sin registro)
   ▼
Backend Next.js (rutas /api, Node)            ← la clave de IA solo vive aquí
   ├─ /api/chat ──► Gemini (function calling) ──► herramientas ──► Base de datos
   ├─ /api/recommend   motor de recomendaciones determinístico (sin IA)
   ├─ /api/products    lectura del catálogo
   ├─ /api/orders      crear / consultar pedidos (validación + límite de intentos)
   └─ /api/delivery-quote  costo de domicilio (si hay tarifas configuradas)
   ▼
libSQL / SQLite (Drizzle ORM): categories, products, compatibilities, orders, order_items, settings
```

**Tecnologías elegidas (sencillas, económicas y escalables):**

- **Next.js 16 + TypeScript + Tailwind CSS 4**: frontend y backend en un solo proyecto.
- **libSQL/SQLite + Drizzle ORM**: archivo local en desarrollo, sin instalar nada. En producción se usa **Turso** (libSQL en la nube) cambiando solo `DATABASE_URL`.
- **Google Gemini API** por REST, sin SDK. El modelo se configura con `GEMINI_MODEL`.
- **Zod** para validar todas las entradas.

### Cómo funciona el Asesor JUDAH

1. El navegador envía el historial (últimos 20 mensajes), el **perfil de necesidades** ya detectado y el contexto (página, carrito, comparador).
2. El backend arma el *system prompt* con la personalidad y las reglas (no inventar precios, tarifas, financiación, etc.) y llama a Gemini con 7 herramientas:

| Herramienta | Qué hace |
|---|---|
| `actualizar_perfil` | Guarda presupuesto, usos, prioridades, marcas y requisitos. El cliente no tiene que repetirlos. |
| `recomendar_celulares` | Ejecuta el motor de recomendaciones y devuelve la mejor opción, una alternativa económica y la de mayores prestaciones, con razones y limitaciones. |
| `buscar_catalogo` | Busca con filtros. |
| `ver_producto` | Devuelve la ficha técnica completa. |
| `accesorios_compatibles` | Devuelve solo compatibilidades **verificadas** en la tabla `compatibilities`. |
| `mostrar_productos` | Muestra tarjetas de productos. |
| `condiciones_tienda` | Consulta garantía, pagos, entregas y datos de la tienda. Si un dato no está configurado, lo dice. |

3. Las **tarjetas** (precio, foto, botones de carrito y comparar) se construyen con datos de la base de datos, **nunca con texto del modelo**.
4. Si la IA no está configurada, falla o supera la cuota, el cliente ve un mensaje claro y puede usar el **modo guiado**, que aplica el mismo motor sin IA.

## 3. Ejecutar el proyecto

Requisitos: **Node.js 20 o superior**.

```bash
git clone <url-del-repo> judah-cell && cd judah-cell
npm install
cp .env.example .env.local        # y pega tu GEMINI_API_KEY
npm run db:setup                  # crea data/judah.db con el catálogo de demostración
npm run dev                       # http://localhost:3000
```

Producción local: `npm run build && npm start`.

### Obtener la clave de Gemini

1. Entra a https://aistudio.google.com/apikey y crea una clave.
2. Pégala en `.env.local` como `GEMINI_API_KEY=...`.
3. (Opcional) Cambia `GEMINI_MODEL`. Por defecto se usa `gemini-flash-latest`. Revisa en AI Studio qué modelos tiene disponibles tu proyecto en la capa gratuita.

### Variables de entorno

Están en `.env.example`. **Nunca** subas `.env.local` a git; ya está en `.gitignore`.

| Variable | Uso |
|---|---|
| `GEMINI_API_KEY` | Clave de Gemini. Solo se usa en el servidor. |
| `GEMINI_MODEL` | Modelo, por ejemplo `gemini-flash-latest`. |
| `GEMINI_API_BASE` | Opcional. Solo para pruebas con el servidor simulado. |
| `DATABASE_URL` | `file:./data/judah.db` en local, `libsql://...` en Turso. |
| `DATABASE_AUTH_TOKEN` | Token de Turso. Vacío en local. |
| `CHAT_RATE_LIMIT_PER_MIN` | Mensajes por minuto por IP. Por defecto, 12. |

## 4. Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilar y ejecutar en producción |
| `npm run db:setup` | Crea las tablas y carga el catálogo de demostración si la base está vacía |
| `npm run db:reset` | Borra todo y recarga el catálogo de demostración |
| `npm run db:reset -- --catalog ruta.json` | Borra todo y carga **otro catálogo** (por ejemplo, el real) |
| `npm test` | Pruebas del motor de recomendaciones y de las validaciones |
| `npm run mock:gemini` | Servidor Gemini simulado para probar el ciclo de herramientas sin gastar cuota |
| `npm run lint` | Chequeo de tipos de TypeScript |

## 5. Sustituir los datos de prueba por datos reales

Consulta **[docs/DATOS-REALES.md](docs/DATOS-REALES.md)**. En resumen: copia `db/seed/catalog.demo.json`, reemplaza productos, precios, existencias, compatibilidades y configuración, y ejecuta `npm run db:reset -- --catalog db/seed/catalog.real.json`. Cuando se carga un catálogo distinto al de demostración, los productos quedan con `isDemo = false` y desaparecen las etiquetas "Demo".

## 6. Seguridad y privacidad

- La clave de IA solo existe en el servidor. El navegador nunca la recibe.
- Todas las entradas se validan con Zod: chat (longitud y estructura), pedidos (celular colombiano, dirección obligatoria para domicilio, cantidades de 1 a 5) y perfil.
- **Los precios del pedido se recalculan en el servidor** desde la base de datos. Antes de registrar el pedido se verifica el inventario.
- Hay un límite de solicitudes por IP en chat, pedidos y consultas, y se verifica el origen al crear pedidos.
- Para consultar un pedido se necesitan el **código y el celular**. La respuesta oculta los dígitos de la dirección y no incluye el correo.
- Solo se guarda lo necesario: nombre, celular, correo opcional y dirección solo si hay domicilio. Hay consentimiento de tratamiento de datos (Ley 1581 de 2012).
- No se solicitan datos bancarios ni se procesan pagos.
- Encabezados de seguridad: `X-Frame-Options`, `nosniff`, `Referrer-Policy` y `Permissions-Policy`.
- El *prompt* indica al modelo que ignore los intentos de cambiar sus reglas. Además, ninguna cifra que ve el cliente en las tarjetas viene del modelo.

**Pendiente para producción:** un panel administrativo con autenticación para gestionar pedidos y estados, un limitador compartido (por ejemplo, Upstash) si hay varias instancias, y la política de privacidad publicada.

## 7. Información que falta (no se inventó)

| Dato | Estado en el MVP | Dónde configurarlo |
|---|---|---|
| Inventario y precios reales | Datos de demostración | `catalog.*.json` → `products` |
| Dirección, horario y WhatsApp del punto físico | Se muestra "por confirmar" | `settings.store_address`, `store_hours`, `whatsapp` |
| Tarifas de domicilio por localidad | "Un asesor confirma el costo" | `settings.delivery.rates` |
| Tiempos de entrega | No se prometen | `settings.delivery.estimated_times` |
| Garantía de accesorios | "Por confirmar" | `warrantyMonths` de cada producto |
| Datos de la cuenta para transferencia | Se entregan por un canal oficial | Proceso comercial |
| Condiciones de Addi y Sistecrédito | Sujetas a aprobación de cada entidad | Integración oficial con cada aliado |
| Procedimiento detallado de garantía | Solo condiciones conocidas | `settings.warranty` |
| Logo en alta resolución | Ícono recortado de la captura enviada | Reemplazar `public/brand/logo-mark.png` |

## 8. Costos estimados del MVP

Las condiciones de cada proveedor cambian, así que verifícalas antes de contratar.

- **Gemini API**: Google ofrece una capa gratuita con límites de uso para modelos Flash y Flash-Lite. Luego se cobra por tokens. Con el modelo Flash y respuestas cortas, el costo por conversación es bajo.
- **Hosting**: Vercel tiene un plan gratuito (Hobby) pensado para uso no comercial. Para operación comercial conviene el plan Pro u otro proveedor, como Render, Railway o un VPS.
- **Base de datos**: Turso tiene un plan gratuito suficiente para este catálogo. SQLite local no tiene costo.

### Despliegue sugerido (Vercel + Turso)

1. Crea una base en Turso y obtén `libsql://...` y el token.
2. Carga los datos desde tu computador: `DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:reset`.
3. Importa el repositorio en Vercel y configura las variables de entorno.

> En Vercel el archivo SQLite local no persiste: usa Turso.

## 9. Estructura

```
src/
  app/                 páginas y rutas API (Next.js App Router)
  components/          interfaz (Header, ProductCard, Comparator, CheckoutForm…)
    advisor/           chat del asesor, tarjetas, modo guiado, panel lateral
    providers/         estado del carrito, comparador y conversación
  lib/
    ai/                cliente Gemini, prompt del sistema y herramientas
    db/                esquema Drizzle y conexión
    catalog.ts         consultas del catálogo y configuración
    recommend.ts       motor de recomendaciones (puro y probado)
    orders.ts          creación y consulta de pedidos
    validation.ts      esquemas Zod
db/
  migrations/          SQL del esquema
  seed/                catálogo de demostración (JSON)
scripts/db-setup.ts    carga del catálogo
tests/                 pruebas y servidor Gemini simulado
docs/                  guías adicionales
```

Consulta también **[docs/PRUEBAS.md](docs/PRUEBAS.md)** para ver las pruebas realizadas y una guía manual de pruebas del chatbot.
