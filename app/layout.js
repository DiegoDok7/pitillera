import './globals.css';
import { SITE } from '@/lib/site';
import { Bricolage_Grotesque, Familjen_Grotesk, IBM_Plex_Mono } from 'next/font/google';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-display',
  display: 'swap',
});

const body = Familjen_Grotesk({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-body',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const description = 'Estuche impreso en 3D con un compartimento para cada cosa, cierre que conserva la humedad y formato de bolsillo. Personaliza colores y textura. Fabricado en España.';

export const metadata = {
  ...(SITE.siteUrl ? { metadataBase: new URL(SITE.siteUrl), alternates: { canonical: '/' } } : {}),
  title: 'Estuche personalizable impreso en 3D · ARIST3D',
  description,
  icons: { icon: '/assets/logo.png' },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: SITE.brand,
    title: 'Todo lo que llevas, en un solo estuche · ARIST3D',
    description,
    images: [{ url: '/assets/top.webp', alt: 'Estuche ARIST3D visto desde arriba' }],
  },
};

// runs before paint: hides the age gate for visitors who already confirmed
const AGE_SCRIPT = "try{if(/(?:^|; )arist3d_age=1/.test(document.cookie))document.documentElement.classList.add('age-ok')}catch(e){}";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: AGE_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
