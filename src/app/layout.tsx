import type { Metadata } from 'next';
import { Lora, Raleway } from 'next/font/google';
import './globals.css';
import { BUSINESS_INFO } from '@/features/site/lib/business-info';

const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', display: 'swap' });

export const metadata: Metadata = {
  title: 'Da Verdinha — Ateliê de plantas no Rio de Janeiro',
  description: BUSINESS_INFO.description,
  openGraph: {
    title: 'Da Verdinha — Ateliê de plantas no Rio de Janeiro',
    description: BUSINESS_INFO.description,
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Da Verdinha — Ateliê de plantas no Rio de Janeiro',
    description: BUSINESS_INFO.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${lora.variable} ${raleway.variable}`}>
      <body>{children}</body>
    </html>
  );
}
