import { render, screen } from '@testing-library/react';
import { StorageUsageNotice } from './StorageUsageNotice';

const GB = 1024 * 1024 * 1024;

describe('StorageUsageNotice', () => {
  // Regressão: um fixture de teste ou payload antigo sem o campo não pode
  // virar "NaN GB de 8.0 GB" na tela.
  it('shows nothing when mediaBytesUsed is missing or not a number', () => {
    render(
      <StorageUsageNotice
        mediaBytesUsed={undefined as unknown as number}
      />,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows nothing when usage is comfortably below the warning threshold', () => {
    render(<StorageUsageNotice mediaBytesUsed={2 * GB} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a neutral notice once usage crosses 80% of the 8 GB cap', () => {
    render(<StorageUsageNotice mediaBytesUsed={6.5 * GB} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Armazenamento de imagens: 6.5 GB de 8.0 GB usados.',
    );
  });

  // Degradar em silêncio é o pior desfecho: o operador tem que saber que
  // fotos novas pararam de chegar, não descobrir só quando um cliente
  // reclamar.
  it('shows an error-level notice once usage reaches the cap', () => {
    render(<StorageUsageNotice mediaBytesUsed={8 * GB} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Armazenamento de imagens cheio (8.0 GB de 8.0 GB). Novas fotos não estão sendo salvas até a faxina liberar espaço.',
    );
  });

  it('keeps showing the error notice past the cap, not just exactly at it', () => {
    render(<StorageUsageNotice mediaBytesUsed={8.5 * GB} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
