import type { Metadata, Viewport } from 'next';
import { Lora, Raleway } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { businessInfo } from '@/data/business';
import { shouldEnableAnalytics } from '@/lib/analytics';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { Analytics } from '@/components/analytics';

const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', display: 'swap' });

export const metadata: Metadata = {
  title: 'Daverdinha — Ateliê de plantas no Rio de Janeiro',
  description: businessInfo.description,
  // O .ico existe porque o navegador pede `/favicon.ico` sozinho, com ou sem
  // link tag, e traz 16/32/48 — os tamanhos que a aba realmente usa. Antes o
  // único ícone declarado era o de 192px, que a aba baixava inteiro só pra
  // reduzir a 16px na hora de desenhar.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  // Verificação de domínio do Facebook/Meta Business. `other` é o que o Next
  // traduz em `<meta name="...">` cru; fica no layout raiz porque o que é
  // verificado é o domínio, não uma página.
  verification: {
    other: {
      'facebook-domain-verification': 'i3ox0yxj3vbn6jc6m4bzm2smhb700s',
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Daverdinha',
  },
  openGraph: {
    title: 'Daverdinha — Ateliê de plantas no Rio de Janeiro',
    description: businessInfo.description,
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daverdinha — Ateliê de plantas no Rio de Janeiro',
    description: businessInfo.description,
  },
};

export const viewport: Viewport = {
  themeColor: '#185928',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" className={`${lora.variable} ${raleway.variable}`}>
        <body>
          {children}
          <ServiceWorkerRegistration />
          {shouldEnableAnalytics() && <Analytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!} />}
        </body>
      </html>
    </ClerkProvider>
  );
}
