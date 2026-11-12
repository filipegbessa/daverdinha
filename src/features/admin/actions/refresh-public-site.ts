'use server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath, updateTag } from 'next/cache';
import { SITE_SETTINGS_TAG } from '@/lib/site-settings';

/**
 * Chamado pelo Dashboard depois de mudar o interruptor do site ou da loja:
 * descarta a leitura em cache dos interruptores e as páginas já geradas, pra
 * mudança aparecer no próximo acesso em vez de esperar o cache de 1 minuto.
 * Só pra quem está logado no admin (a rota `/admin` também é protegida).
 */
export async function refreshPublicSite(): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error('Não autenticado.');
  updateTag(SITE_SETTINGS_TAG);
  revalidatePath('/', 'layout');
}
