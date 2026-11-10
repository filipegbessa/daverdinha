import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Os estados de toda tela do admin enquanto fala com a API. São os únicos
 * componentes pra isso: a primeira carga é `LoadingState` (abaixo do
 * `PageHeader`, que aparece sempre), uma recarga sobre dados já na tela é
 * `BusyRegion`, e o erro é `ErrorAlert`/`ErrorText`. Cores só dos tokens
 * neutros do shadcn: o admin não usa a paleta do site.
 */

/**
 * A primeira carga de uma tela ou bloco: spinner + texto, anunciado como
 * status. `size="sm"` é a versão de dentro de uma mensagem (imagem, áudio).
 */
export function LoadingState({
  label = 'Carregando...',
  size = 'default',
}: {
  label?: string;
  size?: 'default' | 'sm';
}) {
  return (
    <p
      role="status"
      className={cn('flex items-center gap-2 text-muted-foreground', size === 'sm' ? 'gap-1 text-xs' : 'mt-6')}
    >
      <Loader2
        aria-hidden="true"
        className={cn('flex-none motion-safe:animate-spin', size === 'sm' ? 'size-3' : 'size-4')}
      />
      {label}
    </p>
  );
}

/**
 * Envolve o que está sendo recarregado (próxima página, recarga depois de
 * salvar, um toggle em andamento): fica na tela, apagado, com um spinner por
 * cima, sem aceitar clique e marcado `aria-busy`, em vez de sumir atrás de
 * "Carregando..." ou ficar parado parecendo pronto.
 *
 * Não usa `inert` de propósito: ele tiraria o foco do botão que a pessoa
 * acabou de apertar pelo teclado. Os botões de dentro já ficam `disabled`.
 */
export function BusyRegion({
  busy,
  className = '',
  children,
}: {
  busy: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-busy={busy}
      className={cn(
        'relative',
        busy && 'pointer-events-none cursor-wait [&>*:not([data-busy-spinner])]:opacity-50',
        className,
      )}
    >
      {children}
      {busy && (
        <span
          data-busy-spinner
          data-testid="busy-spinner"
          aria-hidden="true"
          className="absolute inset-x-0 top-3 z-10 flex justify-center"
        >
          <span className="rounded-full border border-border bg-background p-1.5 shadow-sm">
            <Loader2 className="size-5 text-muted-foreground motion-safe:animate-spin" />
          </span>
        </span>
      )}
    </div>
  );
}

export function ErrorAlert({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      role="alert"
      className={`mt-4 rounded border border-destructive bg-destructive/10 p-3 text-destructive ${className}`}
    >
      {children}
    </p>
  );
}

/** A versão sem caixa, pro erro que aparece ao lado do controle que o causou. */
export function ErrorText({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <p id={id} role="alert" className={`mt-2 text-destructive ${className}`}>
      {children}
    </p>
  );
}
