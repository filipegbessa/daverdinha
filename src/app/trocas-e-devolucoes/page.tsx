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
 * Regras da lei (Código de Defesa do Consumidor) somadas às respostas da
 * cliente ao `docs/questionario-politicas.md` (partes 3 e 4). Onde a resposta
 * restringia um direito da lei (só crédito no cancelamento, só troca no
 * defeito, devolução só no ateliê), o texto mantém o direito como opção.
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
        <p>
          Ainda não recebeu? Um pedido de pronta entrega pode ser cancelado antes de sair pra entrega. O valor vira
          crédito na loja ou, se preferir, volta pra você.
        </p>
      </PolicySection>
      <PolicySection title="Plantas e mudas">
        <p>
          Cada planta é única: tamanho, folhas e cores podem variar um pouco em relação à foto. Junto com ela vai um
          cartão com a rega e a luz ideais.
        </p>
        <p>
          Se a planta chegar com problema (murcha, quebrada, com praga), avise o quanto antes, de preferência em até{' '}
          <strong>48 horas</strong> depois de receber, pra gente conseguir ajudar. Pela lei, o prazo pra reclamar de
          defeito é de até 30 dias (art. 26).
        </p>
        <p>
          Mande pelo WhatsApp fotos da planta e da embalagem, com o código do pedido. Trocamos por outra planta igual
          ou de mesmo valor; se não tivermos uma pra trocar, devolvemos o dinheiro.
        </p>
        <p>
          Depois de 7 dias da entrega, o cuidado com a planta (rega e luz) fica com você: um problema que aparece depois
          disso por falta de rega ou de luz não é defeito.
        </p>
      </PolicySection>
      <PolicySection title="Vasos e outros produtos">
        <p>
          Vaso quebrado ou com defeito: avise em até <strong>48 horas</strong> depois de receber, com fotos do vaso e
          da embalagem pelo WhatsApp. Pela lei, o prazo pra reclamar de defeito em produto durável é de até 90 dias
          (art. 26).
        </p>
        <p>
          Quer trocar por outro modelo ou tamanho porque mudou de ideia? Passados os 7 dias de desistência, a troca é
          feita só no ateliê, com o produto sem uso. Nas trocas fora desses 7 dias, a entrega fica por nossa conta
          quando é defeito; nos outros casos, por conta de quem pediu a troca.
        </p>
      </PolicySection>
      <PolicySection title="Peças sob encomenda">
        <p>
          As encomendas seguem os modelos do site, e o prazo de confecção aparece na página do produto e no seu pedido.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Dá pra cancelar antes ou durante a confecção, com todo o dinheiro de volta. Avise o quanto antes, porque a
            peça começa a ser feita logo depois do pagamento.
          </li>
          <li>Depois de receber a peça, valem os 7 dias pra desistir, como em qualquer compra pelo site.</li>
          <li>
            Se a confecção atrasar, avisamos pelo WhatsApp com o novo prazo. Você escolhe entre esperar ou cancelar com
            todo o dinheiro de volta.
          </li>
        </ul>
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
        <p>
          O produto volta pelo ateliê: você traz, com hora marcada. Na desistência dentro dos 7 dias e em caso de
          defeito, se você não puder trazer, a gente combina a busca no endereço da entrega, sem custo.
        </p>
      </PolicySection>
      <PolicySection title="Como o dinheiro volta">
        <p>
          Fazemos o estorno em até <strong>3 dias úteis</strong> depois de receber o produto de volta, pelo mesmo meio
          do pagamento. No Pix, o valor volta pra conta usada na compra. No cartão, o estorno aparece
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
