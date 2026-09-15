'use client';

import { useState } from 'react';
import { useInstallPrompt } from '@/features/admin/lib/use-install-prompt';

export function InstallAppNavItem() {
  const { installed, canInstall, isIos, installing, error, promptInstall } = useInstallPrompt();
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  if (installed || (!canInstall && !isIos)) return null;

  function handleClick() {
    if (canInstall) {
      promptInstall();
      return;
    }
    setShowIosInstructions((shown) => !shown);
  }

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        disabled={installing}
        className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-paper hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss disabled:pointer-events-none disabled:opacity-50"
      >
        {installing ? 'Instalando...' : 'Instalar app'}
      </button>
      {showIosInstructions && (
        <p className="px-3 pb-2 text-xs text-ink-soft">
          Toque em Compartilhar e depois em &quot;Adicionar à Tela de Início&quot;.
        </p>
      )}
      {error && (
        <p role="alert" className="px-3 pb-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </li>
  );
}
