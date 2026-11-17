import type { Metadata } from 'next';
import { businessInfo } from '@/data/business';
import { PolicyPage, PolicySection } from '@/features/site/components/PolicyPage';
import { shellProps } from '@/features/site/components/SiteShell';
import { pageMetadata } from '@/features/site/lib/seo';

const PATH = '/politica-de-privacidade';

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Política de Privacidade · Daverdinha',
    description:
      'Quais dados a Daverdinha coleta no site e no WhatsApp, como usa essas informações e como pedir acesso, correção ou exclusão (LGPD).',
    path: PATH,
    // Já é pública antes do lançamento: a página "em breve" linka pra ela.
    indexBeforeLaunch: true,
  });
}

export default async function PoliticaDePrivacidadePage() {
  const { home, storeEnabled } = await shellProps();

  return (
    <PolicyPage home={home} storeEnabled={storeEnabled} title="Política de Privacidade" path={PATH}>
      <p>
        A Daverdinha é um ateliê de plantas no Santo Cristo, Rio de Janeiro. Esta página explica quais dados coletamos
        quando você visita este site ou fala com a gente pelo WhatsApp, e como usamos essas informações.
      </p>
      <PolicySection title="Quais dados coletamos">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Navegação no site:</strong> usamos o Google Analytics pra entender, de forma agregada, quais páginas
            são mais visitadas e de onde vêm os acessos. Esses dados não identificam você pessoalmente.
          </li>
          <li>
            <strong>Conversas pelo WhatsApp:</strong> quando você entra em contato, guardamos seu número de telefone,
            nome (se informado) e o conteúdo da conversa, pra dar continuidade ao atendimento e à entrega.
          </li>
          <li>
            <strong>Compras pelo site:</strong> nome, e-mail, WhatsApp, CPF, CNPJ ou passaporte e o endereço de entrega,
            pra processar o pagamento e entregar o pedido. Pra facilitar a próxima compra, nome, e-mail, WhatsApp e
            endereço ficam salvos só no seu navegador; dá pra apagar no checkout, em &quot;Não é você? Limpar
            dados&quot;.
          </li>
        </ul>
      </PolicySection>
      <PolicySection title="Como usamos esses dados">
        <p>
          Usamos suas informações só pra atender pedidos, responder dúvidas e organizar entregas. Não vendemos nem
          compartilhamos seus dados com terceiros, exceto com o Pagar.me, pra processar o pagamento, ou quando exigido
          por lei.
        </p>
      </PolicySection>
      <PolicySection title="Seus direitos">
        <p>
          De acordo com a Lei Geral de Proteção de Dados (LGPD), você pode pedir pra acessar, corrigir ou excluir seus
          dados a qualquer momento — é só chamar a gente pelo WhatsApp.
        </p>
      </PolicySection>
      <PolicySection title="Contato">
        <p>
          {businessInfo.address.formatted} · {businessInfo.contact.phone.number}
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
