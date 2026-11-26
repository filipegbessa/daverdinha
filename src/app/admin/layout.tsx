import type { Metadata } from 'next';
import { AdminLayoutClient } from './admin-layout-client';

// Favicon do admin: mesma arte do site, fundo branco em vez do verde, pra
// diferenciar a aba de quem navega entre os dois. `icons` num layout filho
// substitui (não mescla com) o do layout raiz pra tudo abaixo de `/admin`.
export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/icons/admin/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/admin/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/admin/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
