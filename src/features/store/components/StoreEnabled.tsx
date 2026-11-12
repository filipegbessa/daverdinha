'use client';
import { createContext, useContext } from 'react';

/**
 * O interruptor da loja pros componentes de cliente. O `SiteShell` (servidor)
 * lê o valor da API e monta o provider; fora dele a loja conta como
 * desligada, que é a falha segura.
 */
const StoreEnabledContext = createContext(false);

export function StoreEnabledProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <StoreEnabledContext.Provider value={value}>{children}</StoreEnabledContext.Provider>;
}

export function useStoreEnabled(): boolean {
  return useContext(StoreEnabledContext);
}

/** Mostra o conteúdo só com a loja ligada (ex.: o "Adicionar" do card de produto). */
export function StoreOnly({ children }: { children: React.ReactNode }) {
  return useStoreEnabled() ? <>{children}</> : null;
}
