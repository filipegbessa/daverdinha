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
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
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
