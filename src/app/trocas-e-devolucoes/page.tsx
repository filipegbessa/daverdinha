import type { Metadata } from 'next';
import Link from 'next/link';
import { businessInfo } from '@/data/business';
import { ContactLink } from '@/features/site/components/ContactLink';
import { PolicyPage, PolicySection } from '@/features/site/components/PolicyPage';
import { shellProps } from '@/features/site/components/SiteShell';
import { pageMetadata } from '@/features/site/lib/seo';
import { DELIVERY_INFO_HREF, MY_ORDERS_HREF, RETURNS_HREF } from '@/features/site/lib/paths';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Trocas e devoluções · Daverdinha',
    description:
      'Como desistir de uma compra feita no site, o que fazer se o produto chegar com problema e como o dinheiro volta.',
    path: RETURNS_HREF,
  });
}

/**
 * Texto-base: só o que a lei garante (Código de Defesa do Consumidor) e o
 * que o site já faz. Prazos e regras próprias da Daverdinha (planta que
 * chega com problema, troca sem defeito, peça sob encomenda) entram com as
 * respostas do `docs/questionario-politicas.md`, revisadas pela cliente.
 */
export default async function TrocasEDevolucoesPage() {
  const { home, storeEnabled, storePause } = await shellProps();
  const { email } = businessInfo.contact;

  return (
    <PolicyPage
      home={home}
      storeEnabled={storeEnabled}
      storePause={storePause}
      title="Trocas e devoluções"
      path={RETURNS_HREF}
    >
      <p>
        Esta página explica como desistir de uma compra feita no site, o que fazer se algo chegar com problema e como o
        dinheiro volta. Ficou alguma dúvida? Fale com a gente antes de comprar.
      </p>
      <PolicySection title="Desistiu da compra? Você tem 7 dias">
        <p>
          Em compras pela internet, você pode desistir em até <strong>7 dias</strong> depois de receber ou retirar o
          pedido, sem precisar explicar o motivo (Código de Defesa do Consumidor, art. 49). Devolvemos todo o valor
          pago, inclusive a entrega.
        </p>
      </PolicySection>
      <PolicySection title="Chegou com problema?">
        <p>Se o produto chegar com defeito ou estragado, avise a gente dentro destes prazos (art. 26):</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Plantas e mudas:</strong> até 30 dias.
          </li>
          <li>
            <strong>Vasos e outros produtos:</strong> até 90 dias.
          </li>
        </ul>
        <p>
          Mande uma foto do problema junto com o código do pedido. A gente resolve com troca ou com o dinheiro de volta.
        </p>
      </PolicySection>
      <PolicySection title="Peças sob encomenda">
        <p>
          O prazo de confecção aparece na página do produto e no seu pedido. Se precisar mudar ou cancelar uma
          encomenda, fale com a gente o quanto antes.
        </p>
      </PolicySection>
      <PolicySection title="Como pedir">
        <p>
          Pelo{' '}
          <ContactLink
            href={getWhatsAppUrl('Oi! Quero falar sobre uma troca ou devolução.')}
            channel="whatsapp"
            location="returns"
            className="font-semibold text-moss underline"
          >
            WhatsApp
          </ContactLink>{' '}
          ou pelo e-mail{' '}
          <ContactLink
            href={`mailto:${email}`}
            channel="email"
            location="returns"
            className="font-semibold text-moss underline"
          >
            {email}
          </ContactLink>
          , informando o código do pedido (começa com DV). O código está no e-mail de confirmação e em{' '}
          <Link href={MY_ORDERS_HREF} className="font-semibold text-moss underline">
            Meus pedidos
          </Link>
          .
        </p>
      </PolicySection>
      <PolicySection title="Como o dinheiro volta">
        <p>
          Pelo mesmo meio do pagamento. No Pix, o valor volta pra conta usada na compra. No cartão, o estorno aparece
          como crédito na fatura, o que pode levar até duas faturas, dependendo do banco. Você recebe um e-mail quando o
          estorno é feito.
        </p>
      </PolicySection>
      <PolicySection title="Ingressos de oficinas e eventos">
        <p>Pra cancelar um ingresso ou uma inscrição, fale com a gente pelo WhatsApp ou por e-mail.</p>
      </PolicySection>
      <p>
        Prazos de entrega e retirada estão em{' '}
        <Link href={DELIVERY_INFO_HREF} className="font-semibold text-moss underline">
          Entrega e retirada
        </Link>
        .
      </p>
    </PolicyPage>
  );
}
