'use client';
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import type { BotSettings, MenuItem } from '@/features/admin/types/admin';

export default function DashboardPage() {
  const { apiFetch } = useApiClient();
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([apiFetch<BotSettings>('/bot-settings'), apiFetch<MenuItem[]>('/menu-items')]).then(
      ([settingsData, items]) => {
        setSettings(settingsData);
        setActiveCount(items.filter((item) => item.active).length);
      },
    );
  }, [apiFetch]);

  async function handleToggle(checked: boolean) {
    setError(null);
    try {
      const updated = await apiFetch<BotSettings>('/bot-settings', {
        method: 'PATCH',
        body: JSON.stringify({ botEnabled: checked }),
      });
      setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar');
    }
  }

  if (!settings) return <p>Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {activeCount === 0 && (
        <p role="alert" className="mt-4 rounded border border-berry bg-berry/10 p-3 text-berry">
          O bot está desativado porque não há nenhum item de menu ativo. Cadastre ou ative um item em &quot;Menu&quot;
          pra poder ligar o atendimento automático.
        </p>
      )}
      <div className="mt-6 flex items-center gap-3">
        <Switch checked={settings.botEnabled} disabled={activeCount === 0} onCheckedChange={handleToggle} />
        <span>{settings.botEnabled ? 'Bot ativo' : 'Bot desativado'}</span>
      </div>
      {error && <p className="mt-2 text-berry">{error}</p>}
    </div>
  );
}
