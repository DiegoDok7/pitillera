import './globals.css';
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

export const metadata = {
  title: 'ARIST3D Pitillera Experience',
  description: 'Landing 3D interactiva de la pitillera ARIST3D.',
  icons: { icon: '/assets/logo.png' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
