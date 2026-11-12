'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export const CONFIRM_INTERVAL_MS = 5_000;
export const CONFIRM_WINDOW_MS = 2 * 60 * 1000;

/**
 * Pedido pendente: relê a página sozinha a cada 5 segundos, por até 2
 * minutos, enquanto a aba está visível. A API confere o pagamento quando o
 * pedido é lido, então quem volta do Pagar.me antes de o Pix ou o webhook
 * serem processados vê a confirmação sem clicar em nada. Depois disso fica
 * o "Já paguei".
 */
export function PaymentConfirmer() {
  const router = useRouter();
  // Num ref, pra o efeito rodar uma vez só: a janela de 2 minutos conta da
  // primeira abertura da página, não de cada atualização.
  const routerRef = useRef(router);
  routerRef.current = router;
  const [active, setActive] = useState(true);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - startedAt >= CONFIRM_WINDOW_MS) {
        window.clearInterval(timer);
        setActive(false);
        return;
      }
      if (document.visibilityState === 'visible') routerRef.current.refresh();
    }, CONFIRM_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  if (!active) return null;
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-ink-soft">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      Confirmando seu pagamento… a página se atualiza sozinha.
    </p>
  );
}
