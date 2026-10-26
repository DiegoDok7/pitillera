import { appendFile, mkdir } from 'fs/promises';
import path from 'path';
import { validateLead } from '@/lib/b2b';

// Fase 1: valida y guarda el lead en data/leads.ndjson (fuera de git, contiene datos personales).
// Fase 2: aviso inmediato a ventas, email automático con el catálogo y alta en el CRM.
const LEADS = path.join(process.cwd(), 'data', 'leads.ndjson');

export async function POST(request) {
  let data;
  try {
    data = await request.json();
  } catch (e) {
    return Response.json({ ok: false, errors: { form: 'Solicitud no válida.' } }, { status: 400 });
  }
  if (data?.web) return Response.json({ ok: true }); // honeypot

  const { errors, lead } = validateLead(data);
  if (Object.keys(errors).length) return Response.json({ ok: false, errors }, { status: 422 });

  try {
    await mkdir(path.dirname(LEADS), { recursive: true });
    await appendFile(LEADS, JSON.stringify({ ...lead, receivedAt: new Date().toISOString() }) + '\n', 'utf8');
  } catch (e) {
    console.error('No se pudo guardar el lead B2B', e);
    return Response.json({ ok: false, errors: {} }, { status: 500 });
  }
  return Response.json({ ok: true });
}
