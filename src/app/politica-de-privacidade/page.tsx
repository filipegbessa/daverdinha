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
  const { home, storeEnabled, storePause } = await shellProps();

  return (
    <PolicyPage
      home={home}
      storeEnabled={storeEnabled}
      storePause={storePause}
      title="Política de Privacidade"
      path={PATH}
    >
      <p>
        A Daverdinha é um ateliê de plantas no Santo Cristo, Rio de Janeiro. Esta página explica quais dados coletamos
        quando você visita este site ou fala com a gente pelo WhatsApp, e como usamos essas informações.
      </p>
      <PolicySection title="Quais dados coletamos">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Navegação no site:</strong> usamos o Google Analytics pra entender, de forma agregada, quais páginas
            são mais visitadas e de onde vêm os acessos. Esses dados não identificam você pessoalmente. Os cookies do
            Analytics só são usados se você aceitar no aviso de cookies, e você pode mudar a escolha a qualquer hora em
            &ldquo;Preferências de cookies&rdquo;, no rodapé do site.
          </li>
          <li>
            <strong>Conversas pelo WhatsApp:</strong> quando você entra em contato, guardamos seu número de telefone,
            nome (se informado) e o conteúdo da conversa, pra dar continuidade ao atendimento e à entrega.
          </li>
          <li>
            <strong>Compras pelo site:</strong> nome, e-mail, WhatsApp e o endereço de entrega e, se você quiser
            informar, CPF, CNPJ ou passaporte, pra processar o pagamento e entregar o pedido. Pra facilitar a próxima
            compra, nome, e-mail, WhatsApp e endereço ficam salvos só no seu navegador; dá pra apagar no checkout, em &quot;Não é você? Limpar
            dados&quot;.
          </li>
          <li>
            <strong>Proteção contra abuso:</strong> quando alguém faz um pedido ou pede os links em &ldquo;Meus
            pedidos&rdquo;, registramos o endereço IP, só pra barrar robôs e tentativas repetidas.
          </li>
        </ul>
      </PolicySection>
      <PolicySection title="Como usamos esses dados">
        <p>
          Usamos suas informações só pra atender pedidos, responder dúvidas e organizar entregas. Não mandamos novidades
          nem promoções por e-mail. Não vendemos seus dados e só os compartilhamos com os serviços que fazem a loja
          funcionar, listados abaixo, ou quando exigido por lei.
        </p>
      </PolicySection>
      <PolicySection title="Serviços que usamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Pagar.me:</strong> processa o pagamento.
          </li>
          <li>
            <strong>Resend:</strong> envia os e-mails do pedido.
          </li>
          <li>
            <strong>Vercel e Neon:</strong> hospedam o site e o banco de dados.
          </li>
          <li>
            <strong>Google Analytics:</strong> mede as visitas, só se você aceitar os cookies.
          </li>
          <li>
            <strong>WhatsApp (Meta):</strong> as conversas de atendimento.
          </li>
        </ul>
      </PolicySection>
      <PolicySection title="Por quanto tempo guardamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Os dados dos pedidos (nome, contato e endereço) ficam guardados por 5 anos, por exigência contábil.</li>
          <li>Fotos e áudios recebidos pelo WhatsApp são apagados depois de 3 anos.</li>
        </ul>
      </PolicySection>
      <PolicySection title="Seus direitos">
        <p>
          De acordo com a Lei Geral de Proteção de Dados (LGPD), você pode pedir pra acessar, corrigir ou excluir seus
          dados a qualquer momento. É só chamar a gente pelo WhatsApp ou escrever pra{' '}
          <a href={`mailto:${businessInfo.contact.email}`} className="font-semibold text-moss underline">
            {businessInfo.contact.email}
          </a>
          .
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
