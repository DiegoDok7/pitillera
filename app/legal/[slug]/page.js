import { notFound } from 'next/navigation';
import { SITE } from '@/lib/site';

// Textos legales pendientes de redacción y revisión profesional; la estructura y las URL ya son las definitivas.
const LEGAL = {
  'aviso-legal': { title: 'Aviso legal' },
  privacidad: { title: 'Política de privacidad' },
  cookies: {
    title: 'Política de cookies',
    points: [
      'mayor_edad: cookie técnica que recuerda que has confirmado ser mayor de edad (1 año).',
      'Almacenamiento local del navegador: guarda tu configuración del personalizador y tu carrito. No sale de tu dispositivo.',
    ],
  },
  'condiciones-de-venta': { title: 'Condiciones de venta' },
  'envios-y-devoluciones': {
    title: 'Envíos y devoluciones',
    points: [
      `Productos estándar: ${SITE.returnDays} días naturales de desistimiento desde la entrega.`,
      'Productos personalizados: se fabrican según las especificaciones del cliente y no admiten devolución por desistimiento.',
      `Garantía: ${SITE.warrantyYears} años frente a defectos de fabricación.`,
    ],
  },
};

const NAME = SITE.brand ?? SITE.product;

export function generateStaticParams() {
  return Object.keys(LEGAL).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: LEGAL[slug] ? `${LEGAL[slug].title} · ${NAME}` : NAME };
}

const v = (x, label) => x ?? <span className="todo">[{label}]</span>;

export default async function LegalPage({ params }) {
  const { slug } = await params;
  const page = LEGAL[slug];
  if (!page) notFound();
  const m = SITE.manufacturer;
  return (
    <main className="legal">
      <a className="back" href="/">← Volver a la tienda</a>
      <h1>{page.title}</h1>
      <p className="todo-block">[Texto pendiente de redacción y revisión legal]</p>
      {page.points && <ul>{page.points.map((p) => <li key={p}>{p}</li>)}</ul>}
      <h2>Responsable</h2>
      <p>{v(m.name, 'NOMBRE O RAZÓN SOCIAL')}<br />{v(m.address, 'DIRECCIÓN')}<br />{v(m.email, 'EMAIL')}</p>
    </main>
  );
}
