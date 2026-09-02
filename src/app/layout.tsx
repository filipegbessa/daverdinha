import type { Metadata } from 'next';
import { Lora, Raleway } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import { businessInfo } from '@/data/business';
import { shouldEnableAnalytics } from '@/lib/analytics';

const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', display: 'swap' });

export const metadata: Metadata = {
  title: 'Daverdinha — Ateliê de plantas no Rio de Janeiro',
  description: businessInfo.description,
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${lora.variable} ${raleway.variable}`}>
      <body>
        {children}
        {shouldEnableAnalytics() && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!} />}
      </body>
    </html>
  );
}
