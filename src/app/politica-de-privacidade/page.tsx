import type { Metadata } from 'next';
import { businessInfo } from '@/data/business';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Daverdinha',
};

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Política de Privacidade</h1>
      <div className="mt-6 space-y-6 text-ink-soft">
        <p>
          A Daverdinha é um ateliê de plantas no Santo Cristo, Rio de Janeiro. Esta página explica quais
          dados coletamos quando você visita este site ou fala com a gente pelo WhatsApp, e como usamos essas
          informações.
        </p>
        <section>
          <h2 className="text-xl font-medium text-ink">Quais dados coletamos</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>Navegação no site:</strong> usamos o Google Analytics pra entender, de forma agregada,
              quais páginas são mais visitadas e de onde vêm os acessos. Esses dados não identificam você
              pessoalmente.
            </li>
            <li>
              <strong>Conversas pelo WhatsApp:</strong> quando você entra em contato, guardamos seu número de
              telefone, nome (se informado) e o conteúdo da conversa, pra dar continuidade ao atendimento e à
              entrega.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-medium text-ink">Como usamos esses dados</h2>
          <p className="mt-2">
            Usamos suas informações só pra atender pedidos, responder dúvidas e organizar entregas. Não
            vendemos nem compartilhamos seus dados com terceiros, exceto quando exigido por lei.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-medium text-ink">Seus direitos</h2>
          <p className="mt-2">
            De acordo com a Lei Geral de Proteção de Dados (LGPD), você pode pedir pra acessar, corrigir ou
            excluir seus dados a qualquer momento — é só chamar a gente pelo WhatsApp.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-medium text-ink">Contato</h2>
          <p className="mt-2">
            {businessInfo.address.formatted} · {businessInfo.contact.phone.number}
          </p>
        </section>
      </div>
    </main>
  );
}
