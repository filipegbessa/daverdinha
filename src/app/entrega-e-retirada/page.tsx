import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { CepChecker } from '@/features/site/components/CepChecker';
import { ContactLink } from '@/features/site/components/ContactLink';
import { PolicyPage, PolicySection } from '@/features/site/components/PolicyPage';
import { shellProps } from '@/features/site/components/SiteShell';
import { getCoveredDeliveryZones } from '@/features/site/lib/delivery-zones';
import { getPickupInfo } from '@/features/site/lib/pickup-info';
import { pageMetadata } from '@/features/site/lib/seo';
import { DELIVERY_INFO_HREF, RETURNS_HREF } from '@/features/site/lib/paths';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Entrega e retirada · Daverdinha',
    description: 'Onde a Daverdinha entrega no Rio, como funciona a entrega e a retirada no ateliê.',
    path: DELIVERY_INFO_HREF,
  });
}

/**
 * Bairros e retirada vêm do admin (a mesma lista do bot e do checkout), não
 * de texto fixo. Prazos próprios entram com as respostas do
 * `docs/questionario-politicas.md`.
 */
export default async function EntregaERetiradaPage() {
  const [{ home, storeEnabled, storePause }, zones, pickup] = await Promise.all([
    shellProps(),
    getCoveredDeliveryZones(),
    getPickupInfo(),
  ]);

  return (
    <PolicyPage
      home={home}
      storeEnabled={storeEnabled}
      storePause={storePause}
      title="Entrega e retirada"
      path={DELIVERY_INFO_HREF}
    >
      <PolicySection title="Entrega">
        <p>
          Entregamos no Rio de Janeiro, nos bairros abaixo. O valor da entrega depende do bairro e aparece no carrinho
          quando você informa o CEP.
        </p>
        <p>
          Depois da confirmação do pagamento, combinamos o dia da entrega pelo WhatsApp e avisamos quando o pedido sair.
          Peças sob encomenda saem depois da confecção, no prazo informado na página do produto.
        </p>
        <div className="pt-2">
          <CepChecker />
        </div>
        {zones.length > 0 ? (
          <ul className="grid gap-3 pt-2 sm:grid-cols-2">
            {zones.map((zone) => (
              <li key={zone.zone} className="rounded-2xl border border-sand-line bg-paper p-4">
                <p className="flex items-center gap-2 font-medium text-berry">
                  <MapPin className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  {zone.zone}
                </p>
                <p className="mt-1 text-sm">{zone.bairros.join(', ')}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Pra saber se entregamos no seu bairro,{' '}
            <ContactLink
              href={getWhatsAppUrl('Oi! Vocês entregam no meu bairro?')}
              channel="whatsapp"
              location="delivery_info"
              className="font-semibold text-moss underline"
            >
              fale com a gente pelo WhatsApp
            </ContactLink>
            .
          </p>
        )}
      </PolicySection>
      <PolicySection title="Retirada no ateliê">
        {pickup ? (
          <>
            <p className="whitespace-pre-line">
              <strong className="text-ink">{pickup.address}</strong>
              <br />
              {pickup.hours}
            </p>
            {pickup.instructions && <p className="whitespace-pre-line">{pickup.instructions}</p>}
            <p>
              A retirada não tem custo. Avisamos pelo WhatsApp e por e-mail quando o pedido estiver pronto. Na retirada,
              é só dizer o código do pedido (começa com DV).
            </p>
          </>
        ) : (
          <p>No momento, os pedidos do site são só com entrega.</p>
        )}
      </PolicySection>
      <p>
        Desistiu ou algo chegou com problema? Veja{' '}
        <Link href={RETURNS_HREF} className="font-semibold text-moss underline">
          Trocas e devoluções
        </Link>
        .
      </p>
    </PolicyPage>
  );
}
