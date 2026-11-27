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
 * de texto fixo. Prazos, dias de entrega e regras da retirada vêm das
 * respostas da cliente ao `docs/questionario-politicas.md` (partes 1 a 3).
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
          Produtos de pronta entrega chegam em até <strong>4 dias úteis</strong> depois da confirmação do pagamento. O
          dia é combinado com você pelo WhatsApp. Peças sob encomenda saem depois da confecção, no prazo informado na
          página do produto.
        </p>
        <p>
          Entregamos de <strong>quinta a sábado, das 10h às 16h</strong>, e avisamos pelo WhatsApp, com o horário
          previsto, quando o pedido sair.
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
      <PolicySection title="Na hora de receber">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Qualquer pessoa no endereço pode receber (porteiro, vizinho, familiar). A partir daí, o pedido fica sob a
            responsabilidade de quem recebeu.
          </li>
          <li>
            Se não tiver ninguém pra receber, combinamos uma nova tentativa sem custo. Se a segunda também não der certo,
            o pedido fica para retirar no ateliê.
          </li>
          <li>
            Plantas que dá pra embalar vão em papel kraft. Ao receber, tire a planta da embalagem na hora e deixe em
            lugar fresco.
          </li>
        </ul>
      </PolicySection>
      <PolicySection title="É presente?">
        <p>
          Dá pra mandar pra outra pessoa: coloque o endereço de quem vai receber no checkout e mande o recado pelo
          WhatsApp, que a gente escreve num cartão.
        </p>
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
              A retirada não tem custo e é <strong>com hora marcada</strong>: o ateliê não abre todos os dias. O pedido
              fica pronto em até 3 dias úteis depois da confirmação do pagamento; aí avisamos pelo WhatsApp e por e-mail
              e combinamos o dia.
            </p>
            <p>
              Na retirada, é só dizer o código do pedido (começa com DV) e o nome de quem comprou. Outra pessoa pode
              buscar no seu lugar com essas duas informações.
            </p>
            <p>
              O pedido fica guardado por até 10 dias depois do aviso. Passado esse prazo, entramos em contato. Se não
              tivermos retorno, a planta pode ir pra outro cliente, e o valor pago vira crédito na loja (ou volta pra
              você, se preferir).
            </p>
          </>
        ) : (
          <p>No momento, os pedidos do site são só com entrega.</p>
        )}
      </PolicySection>
      <PolicySection title="Se o pedido não puder sair">
        <p>
          Se, depois do pagamento, um produto não puder ser enviado (uma planta que se perdeu, um erro de estoque),
          avisamos pelo WhatsApp em até 1 dia útil, e você escolhe entre trocar por outro produto ou receber todo o
          dinheiro de volta.
        </p>
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
