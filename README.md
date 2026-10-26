# Estuche impreso en 3D

Landing de venta del estuche, hecha con Next.js. El contenido se renderiza en el servidor (SEO orgánico) y el estuche en 3D (Three.js) acompaña toda la página: se imprime al cargar, se abre, se personaliza en tiempo real y cambia de pose y de lado en cada sección.

## Ejecutar en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

## Build

```bash
npm run build
npm start
```

## Estructura de la página

| # | Sección | Estuche 3D |
|---|---|---|
| 0 | Aviso de mayoría de edad (cookie `mayor_edad`, 1 año) | — |
| 1 | Hero: titular, Comprar / Personalizar, microconfianza | Se imprime y abre la tapa |
| 2 | Problema → solución | Abierto, con el cajón fuera |
| 3 | Anatomía (pendiente del modelo 3D real) | Abierto con etiquetas numeradas |
| 4 | Especificaciones | Cerrado, girando a la izquierda |
| 5 | Personalizador por pasos + carrito | Interactivo |
| 6 | Galería | Pequeño sobre las fotos |
| 7 | Opiniones (solo se muestra si hay valoraciones reales) | Girando |
| 8 | Tiendas (B2B) con formulario | Con el cajón fuera |
| 9 | FAQ (con datos estructurados FAQPage) | Abierto, a la izquierda |
| 10 | CTA final | Girando en el centro |
| 11 | Footer legal y páginas `/legal/*` | — |

Las poses están en `KF` dentro de `lib/scene.js` (una por `data-k` de cada sección). En móvil, en las secciones de texto largo el estuche queda atenuado detrás del contenido.

## Archivos

| Ruta | Contenido |
|---|---|
| `lib/site.js` | **Datos del producto y de la tienda**: precios, plazos, medidas, fabricante, FAQ. Lo que está a `null` aparece en la web como marcador `[ … ]` |
| `app/page.js` | Página (server component) y datos estructurados Product + FAQPage |
| `app/legal/[slug]/page.js` | Aviso legal, privacidad, cookies, condiciones, envíos y devoluciones |
| `app/api/b2b/route.js` | Recepción del formulario B2B |
| `components/` | Aviso de edad, carrito, personalizador, botones de compra, formulario B2B, arranque del 3D |
| `lib/cart.js` | Carrito local, SKU y atributos del pedido personalizado |
| `lib/b2b.js` | Opciones y validación del formulario (incluye NIF/NIE/CIF) |
| `lib/scene.js` | Escena Three.js, coreografía por scroll e interacción |
| `lib/pitillera.js` | Modelo 3D procedural, catálogo de colores, texturas y acabados |
| `public/model/pitillera.glb` | Modelo 3D exportado (glTF binario, en metros) |

## Personalización

El estuche base es ciruela con relieve amarillo y patrón leopardo, acabado mate (`DEFAULT_LOOK`). Colores, texturas (patrones de la tapa) y acabados están en `lib/pitillera.js` (`BODY_COLORS`, `LID_COLORS`, `ACCENT_COLORS`, `PATTERNS`, `FINISHES`). El personalizador genera los botones a partir de esas listas. Para añadir un patrón, crea su función de dibujo en `DRAW` (mismo `id`) y añádelo a `PATTERNS`.

Cada pedido personalizado se guarda con un SKU (`EST-C-<cuerpo>-<tapa>-<patrón>-<relieve>-<acabado>`) y sus atributos en JSON (`attrs`), listos para producción.

## Pendiente

**Datos** (en `lib/site.js`): nombre comercial (`brand`; mientras falte se muestra «Estuche 3D»), precio base y suplemento del acabado texturizado, plazos de fabricación y envío, dimensiones, peso, capacidad, datos del fabricante, URL pública, catálogo PDF y valoraciones reales.

**Contenido**: textos legales, modelo 3D real para la sección de anatomía y fotos de producto en contexto para la galería.

**Fase 2**:
- Pago con Stripe u otra pasarela (revisar su lista de actividades restringidas). El botón del carrito está desactivado hasta entonces.
- Formulario B2B: aviso inmediato a ventas, email automático con el catálogo y alta en el CRM. Por ahora la ruta valida y guarda cada solicitud en `data/leads.ndjson` (excluido de git porque contiene datos personales). En un hosting sin disco persistente (p. ej. Vercel) esto hay que sustituirlo por un servicio externo.

## Dependencias

- [Next.js](https://nextjs.org)
- [Three.js 0.160.0](https://threejs.org)
- [Lenis 1.3.26](https://github.com/darkroomengineering/lenis) para el scroll suave
- Google Fonts vía `next/font`: Bricolage Grotesque, Familjen Grotesk, IBM Plex Mono
