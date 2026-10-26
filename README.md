# ARIST3D · Pitillera

Landing 3D interactiva de la pitillera ARIST3D, hecha con Next.js: la pieza se imprime al cargar, se separa en capas, se abre (tapa y cajón inferior), se despieza, se puede girar con el ratón o el dedo y se personaliza (color del cuerpo, color del relieve y patrón de la tapa).

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

## Estructura

| Ruta | Contenido |
|---|---|
| `app/page.js` | Página de la landing |
| `app/globals.css` | Estilos |
| `components/Experience.js` | Monta la experiencia en el cliente |
| `lib/scene.js` | Escena Three.js, postprocesado, coreografía por scroll e interacción |
| `lib/pitillera.js` | Modelo 3D procedural de la pitillera (cuerpo, tapa con cierre, dos compartimentos y cajón inferior) |
| `public/assets/` | Logo y fotos del producto |
| `public/model/ARIST3D_pitillera.glb` | Modelo 3D exportado desde `lib/pitillera.js` (glTF binario, en metros; nodos `bisagra` y `cajon` animables) |

## Personalización

Los colores y patrones están en `lib/pitillera.js` (`BODY_COLORS`, `ACCENT_COLORS`, `PATTERNS`); la sección «Personaliza» genera los botones a partir de esas listas. Para añadir un patrón, crea su función de dibujo en `DRAW` (mismo `id`) y añádelo a `PATTERNS`. La elección se guarda en el navegador (`localStorage`).

## Dependencias

- [Next.js](https://nextjs.org)
- [Three.js 0.160.0](https://threejs.org)
- [Lenis 1.3.26](https://github.com/darkroomengineering/lenis) para el scroll suave
- Google Fonts vía `next/font`: Bricolage Grotesque, Familjen Grotesk, IBM Plex Mono

## Pendiente

- Añadir enlace de compra o contacto en la sección final.
- Sustituir el modelo procedural por el STL/3MF real de la pieza si se quiere exactitud de proporciones y estampado.
