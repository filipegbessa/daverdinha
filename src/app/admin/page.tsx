'use client';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { ErrorAlert, ErrorText, LoadingState } from '@/features/admin/components/StatusMessage';
import { StorageUsageNotice } from '@/features/admin/components/StorageUsageNotice';
import type { BotSettings, MenuItem } from '@/features/admin/types/admin';

export default function DashboardPage() {
  const { apiFetch } = useApiClient();
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useApiResource<BotSettings>('/bot-settings');
  const {
    data: menuItems,
    isLoading: isLoadingMenuItems,
    error: menuItemsError,
  } = useApiResource<MenuItem[]>('/menu-items');
  const toggle = useApiMutation('Erro ao atualizar');

  // `null` é "ainda não sei", que não é a mesma coisa que "nenhum ativo".
  // Colapsar os dois em `?? 0` era o que fazia o painel acusar a loja de não
  // ter item de menu nenhum a cada primeiro acesso: `/bot-settings` respondia
  // antes de `/menu-items`, a página já renderizava, e o aviso sumia sozinho
  // quando a lista chegava.
  const activeCount = menuItems?.filter((item) => item.active).length ?? null;

  // Espera as duas cargas. Antes só a de configurações segurava a renderização.
  if (isLoading || isLoadingMenuItems) return <LoadingState />;
  if (!settings) return <ErrorAlert>{error ?? 'Não foi possível carregar os dados do painel.'}</ErrorAlert>;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
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
          checked={settings.botEnabled}
          // Com a lista carregada e vazia, travar faz sentido. Sem a lista, não:
          // desligar o bot numa emergência não pode depender de um endpoint que
          // acabou de falhar — e ligar sem item ativo a API já recusa sozinha.
          disabled={activeCount === 0 || toggle.isPending}
          onCheckedChange={(checked) =>
            toggle
              .run(() => apiFetch('/bot-settings', { method: 'PATCH', body: JSON.stringify({ botEnabled: checked }) }))
              .then((ok) => ok && refetch())
          }
        />
        <span>{settings.botEnabled ? 'Bot ativo' : 'Bot desativado'}</span>
      </div>
      {toggle.error && <ErrorText>{toggle.error}</ErrorText>}
    </div>
  );
}
