import type { Metadata } from 'next';
import { Lora, Raleway } from 'next/font/google';
import './globals.css';

const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', display: 'swap' });

export const metadata: Metadata = {
  title: 'Da Verdinha — Ateliê de plantas no Rio de Janeiro',
  description:
    'Vasos, mudas e um cantinho verde pra chamar de seu. Atendimento e entrega combinados direto pelo WhatsApp.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${lora.variable} ${raleway.variable}`}>
      <body>{children}</body>
    </html>
  );
}
