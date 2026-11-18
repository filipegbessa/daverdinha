import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroSlideForm } from './HeroSlideForm';
import { mockApi } from '@/features/admin/test-fixtures/mock-api';
import { terrarioSlide } from '@/features/admin/test-fixtures/hero-slide';

jest.mock('@/features/admin/lib/api-client');

function sentFields(apiFetch: jest.Mock) {
  const body = apiFetch.mock.calls.at(-1)[1].body as FormData;
  return Object.fromEntries([...body.entries()].filter(([, v]) => typeof v === 'string'));
}

describe('HeroSlideForm', () => {
  it('creates a slide with empty optional fields as "" and dates in UTC', async () => {
    const apiFetch = mockApi(() => terrarioSlide);
    const onSaved = jest.fn();
    render(<HeroSlideForm slide={null} onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText('Título'), 'Kits de Natal');
    await userEvent.type(screen.getByLabelText('Texto do botão', { selector: '#slideLinkLabel' }), 'Ver kits');
    await userEvent.type(screen.getByLabelText('Link'), '/produtos/kits');
    await userEvent.type(screen.getByLabelText('Termina em'), '2026-12-25T23:59');
    await userEvent.click(screen.getByRole('button', { name: 'Criar destaque' }));

    expect(apiFetch).toHaveBeenCalledWith('/hero-slides', expect.objectContaining({ method: 'POST' }));
    expect(sentFields(apiFetch)).toEqual({
      eyebrow: '',
      title: 'Kits de Natal',
      description: '',
      linkLabel: 'Ver kits',
      linkUrl: '/produtos/kits',
      whatsappLabel: '',
      whatsappMessage: '',
      active: 'true',
      startsAt: '',
      endsAt: '2026-12-26T02:59:00.000Z',
    });
    expect(onSaved).toHaveBeenCalledWith(terrarioSlide);
  });

  it('asks for both the text and the link of the main button', async () => {
    const apiFetch = mockApi(() => terrarioSlide);
    render(<HeroSlideForm slide={null} onSaved={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Título'), 'T');
    await userEvent.type(screen.getByLabelText('Texto do botão', { selector: '#slideLinkLabel' }), 'Ver');
    await userEvent.click(screen.getByRole('button', { name: 'Criar destaque' }));
    expect(screen.getByText('Preencha o texto e o link do botão, ou deixe os dois vazios.')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Link'), 'produtos');
    await userEvent.click(screen.getByRole('button', { name: 'Criar destaque' }));
    expect(screen.getByText(/O link precisa começar com "\/"/)).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('refuses an end before the start', async () => {
    const apiFetch = mockApi(() => terrarioSlide);
    render(<HeroSlideForm slide={null} onSaved={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Título'), 'T');
    await userEvent.type(screen.getByLabelText('Começa em'), '2026-12-02T10:00');
    await userEvent.type(screen.getByLabelText('Termina em'), '2026-12-01T10:00');
    await userEvent.click(screen.getByRole('button', { name: 'Criar destaque' }));

    expect(screen.getByText('O fim tem que ser depois do início.')).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('edits a slide with PATCH and shows the preview with both buttons', async () => {
    const apiFetch = mockApi(() => ({ ...terrarioSlide, title: 'Oficina de terrário' }));
    render(<HeroSlideForm slide={terrarioSlide} onSaved={jest.fn()} />);

    const preview = screen.getByLabelText('Prévia do slide');
    expect(preview).toHaveTextContent('Ver agenda');
    expect(preview).toHaveTextContent('Falar no WhatsApp');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    await userEvent.clear(screen.getByLabelText('Título'));
    await userEvent.type(screen.getByLabelText('Título'), 'Oficina de terrário');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith('/hero-slides/s1', expect.objectContaining({ method: 'PATCH' }));
    expect(await screen.findByText('Alterações salvas.')).toBeInTheDocument();
  });
});
