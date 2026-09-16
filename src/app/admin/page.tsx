'use client';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { ErrorAlert, ErrorText, LoadingState } from '@/features/admin/components/StatusMessage';
import type { BotSettings, MenuItem } from '@/features/admin/types/admin';

export default function DashboardPage() {
  const { apiFetch } = useApiClient();
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useApiResource<BotSettings>('/bot-settings');
  const { data: menuItems } = useApiResource<MenuItem[]>('/menu-items');
  const toggle = useApiMutation('Erro ao atualizar');

  const activeCount = menuItems?.filter((item) => item.active).length ?? 0;

  if (isLoading) return <LoadingState />;
  if (!settings) return <ErrorAlert>{error ?? 'Não foi possível carregar os dados do painel.'}</ErrorAlert>;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {activeCount === 0 && (
        <ErrorAlert>
          O bot está desativado porque não há nenhum item de menu ativo. Cadastre ou ative um item em &quot;Menu&quot;
          pra poder ligar o atendimento automático.
        </ErrorAlert>
      )}
      <div className="mt-6 flex items-center gap-3">
        <Switch
          checked={settings.botEnabled}
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
