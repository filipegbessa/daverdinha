import { Breadcrumbs } from '@/features/site/components/Breadcrumbs';
import { SiteShell } from '@/features/site/components/SiteShell';
import type { StorePause } from '@/lib/site-settings';

/**
 * A moldura das páginas de texto (privacidade, trocas, entrega): trilha,
 * título e o texto numa coluna de leitura.
 */
export function PolicyPage({
  home,
  storeEnabled,
  storePause = null,
  title,
  path,
  children,
}: {
  home: string;
  storeEnabled: boolean;
  storePause?: StorePause | null;
  title: string;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <SiteShell home={home} storeEnabled={storeEnabled} storePause={storePause}>
      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs
            crumbs={[
              { name: 'Início', path: home },
              { name: title, path },
            ]}
          />
          <h1 className="mt-4 font-serif text-3xl font-semibold text-ink md:text-4xl">{title}</h1>
          <div className="mt-6 space-y-6 leading-relaxed text-ink-soft">{children}</div>
        </div>
      </section>
    </SiteShell>
  );
}

export function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl font-semibold text-ink">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
