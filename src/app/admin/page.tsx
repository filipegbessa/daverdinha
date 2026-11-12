'use client';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { ErrorAlert, ErrorText, LoadingState } from '@/features/admin/components/StatusMessage';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { StorageUsageNotice } from '@/features/admin/components/StorageUsageNotice';
import type { BotSettings, MenuItem, StoreSettings } from '@/features/admin/types/admin';
import { refreshPublicSite } from '@/features/admin/actions/refresh-public-site';

export default function DashboardPage() {
  const { apiFetch } = useApiClient();
  const { data: settings, isLoading, error, refetch } = useApiResource<BotSettings>('/bot-settings');
  const {
    data: menuItems,
    isLoading: isLoadingMenuItems,
    error: menuItemsError,
  } = useApiResource<MenuItem[]>('/menu-items');
  const toggle = useApiMutation('Erro ao atualizar o bot.');
  // Site e loja vêm de outra rota: se ela falhar, o interruptor do bot continua
  // funcionando (desligar o bot numa emergência não pode depender dela).
  const {
    data: storeSettings,
    error: storeSettingsError,
    refetch: refetchStoreSettings,
  } = useApiResource<StoreSettings>('/store-settings');
  const storeToggle = useApiMutation('Erro ao atualizar o site.');

  function patchStoreSettings(changes: Partial<Pick<StoreSettings, 'siteEnabled' | 'storeEnabled'>>) {
    storeToggle
      .run(() => apiFetch('/store-settings', { method: 'PATCH', body: JSON.stringify(changes) }))
      .then(async (ok) => {
        if (!ok) return;
        refetchStoreSettings();
        // Sem isso o site levaria até 1 minuto pra refletir. Se falhar, o
        // cache vence sozinho: não é motivo pra acusar erro no interruptor.
        await refreshPublicSite().catch(() => {});
      });
  }

  // `null` é "ainda não sei", que não é a mesma coisa que "nenhum ativo".
  // Colapsar os dois em `?? 0` era o que fazia o painel acusar a loja de não
  // ter item de menu nenhum a cada primeiro acesso: `/bot-settings` respondia
  // antes de `/menu-items`, a página já renderizava, e o aviso sumia sozinho
  // quando a lista chegava.
  const activeCount = menuItems?.filter((item) => item.active).length ?? null;

  // Espera as duas cargas. Antes só a de configurações segurava a renderização.
  // O título aparece sempre; o carregando ou o erro ficam embaixo dele.
  if (isLoading || isLoadingMenuItems || !settings) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        {isLoading || isLoadingMenuItems ? (
          <LoadingState />
        ) : (
          <ErrorAlert>{error ?? 'Não foi possível carregar os dados do painel.'}</ErrorAlert>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" />
      {activeCount === null ? (
        <ErrorAlert>{menuItemsError ?? 'Não foi possível carregar os itens de menu.'}</ErrorAlert>
      ) : (
        activeCount === 0 && (
          <ErrorAlert>
            O bot está desativado porque não há nenhum item de menu ativo. Cadastre ou ative um item em &quot;Menu&quot;
            pra poder ligar o atendimento automático.
          </ErrorAlert>
        )
      )}
      <StorageUsageNotice mediaBytesUsed={settings.mediaBytesUsed} />
      <div className="mt-6 flex items-center gap-3">
        <Switch
          // O texto ao lado muda com o estado; o nome do controle fica fixo,
          // pra leitura de tela não virar "Bot desativado, desligado".
          aria-label="Atendimento automático do bot"
          checked={settings.botEnabled}
          // Com a lista carregada e vazia, travar faz sentido. Sem a lista, não:
          // desligar o bot numa emergência não pode depender de um endpoint que
          // acabou de falhar — e ligar sem item ativo a API já recusa sozinha.
          disabled={activeCount === 0 || toggle.isPending}
          onCheckedChange={(checked) =>
            toggle
              .run(() => apiFetch('/bot-settings', { method: 'PATCH', body: JSON.stringify({ botEnabled: checked }) }))
              .then((ok) => {
                if (ok) refetch();
              })
          }
        />
        <span aria-hidden="true">{settings.botEnabled ? 'Bot ativo' : 'Bot desativado'}</span>
      </div>
      {toggle.error && <ErrorText>{toggle.error}</ErrorText>}

      <section aria-labelledby="site-switches-title" className="mt-8 space-y-4">
        <h2 id="site-switches-title" className="text-sm font-semibold">
          Site e loja
        </h2>
        {storeSettings ? (
          <>
            <SwitchRow
              label="Site completo"
              checked={storeSettings.siteEnabled}
              disabled={storeToggle.isPending}
              onCheckedChange={(checked) => patchStoreSettings({ siteEnabled: checked })}
              state={storeSettings.siteEnabled ? 'Site ativo' : 'Site desativado'}
              hint={
                storeSettings.siteEnabled
                  ? 'O endereço principal mostra o site completo.'
                  : 'O endereço principal mostra a página "em breve". O site completo fica só na prévia (/site).'
              }
            />
            <SwitchRow
              label="Loja do site"
              checked={storeSettings.storeEnabled}
              disabled={storeToggle.isPending}
              onCheckedChange={(checked) => patchStoreSettings({ storeEnabled: checked })}
              state={storeSettings.storeEnabled ? 'Loja ativa' : 'Loja desativada'}
              hint={
                storeSettings.storeEnabled
                  ? 'Venda pelo site, com carrinho e pagamento pelo Pagar.me.'
                  : 'Sem carrinho: os produtos levam pra comprar pelo WhatsApp.'
              }
            />
            {storeSettings.storeEnabled && !storeSettings.paymentConfigured && (
              <p role="status" className="text-xs text-amber-700 dark:text-amber-400">
                O pagamento ainda não está configurado (chave do Pagar.me): a loja aparece no site, mas finalizar a
                compra não funciona.
              </p>
            )}
            {storeToggle.error && <ErrorText>{storeToggle.error}</ErrorText>}
          </>
        ) : storeSettingsError ? (
          <ErrorText>{storeSettingsError}</ErrorText>
        ) : (
          <LoadingState />
        )}
      </section>
    </div>
  );
}

/** Um interruptor com o estado ao lado e uma linha explicando o efeito. */
function SwitchRow({
  label,
  state,
  hint,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  state: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        {/* Nome fixo no controle; o estado muda só no texto ao lado. */}
        <Switch aria-label={label} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
        <span aria-hidden="true">{state}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
