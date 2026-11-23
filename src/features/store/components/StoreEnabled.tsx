'use client';
import { createContext, useContext } from 'react';
import type { StorePause } from '@/lib/site-settings';

/**
 * O interruptor da loja pros componentes de cliente. O `SiteShell` (servidor)
 * lê o valor da API e monta o provider; fora dele a loja conta como
 * desligada, que é a falha segura.
 */
const StoreEnabledContext = createContext(false);

/**
 * A pausa da loja (férias): os produtos continuam à mostra, mas nada vai pro
 * carrinho nem pro checkout. Ingressos não param.
 */
const StorePauseContext = createContext<StorePause | null>(null);

export function StoreEnabledProvider({
  value,
  pause = null,
  children,
}: {
  value: boolean;
  pause?: StorePause | null;
  children: React.ReactNode;
}) {
  return (
    <StoreEnabledContext.Provider value={value}>
      <StorePauseContext.Provider value={value ? pause : null}>{children}</StorePauseContext.Provider>
    </StoreEnabledContext.Provider>
  );
}

export function useStoreEnabled(): boolean {
  return useContext(StoreEnabledContext);
}

/** A pausa em vigor, ou `null` com a loja recebendo pedidos (ou desligada). */
export function useStorePause(): StorePause | null {
  return useContext(StorePauseContext);
}

/** Mostra o conteúdo só com a loja ligada e fora da pausa (ex.: o "Adicionar" do card de produto). */
export function StoreOnly({ children }: { children: React.ReactNode }) {
  const enabled = useStoreEnabled();
  const pause = useStorePause();
  return enabled && !pause ? <>{children}</> : null;
}
