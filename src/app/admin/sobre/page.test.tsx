import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SobrePage from './page';
import { mockApi } from '@/features/admin/test-fixtures/mock-api';
import type { AboutContent } from '@/features/admin/types/admin';

jest.mock('@/features/admin/lib/api-client');

const notSaved: AboutContent = {
  configured: false,
  title: null,
  text: null,
  imageUrl: null,
  instagramLabel: null,
  updatedAt: null,
};

const saved: AboutContent = {
  configured: true,
  title: 'Nossa história',
  text: 'Começou numa varanda.',
  imageUrl: 'https://blob/site/foto.webp',
  instagramLabel: null,
  updatedAt: '2026-11-18T12:00:00.000Z',
};

describe('SobrePage', () => {
  it('starts from the text the site shows today, and saves it as is', async () => {
    const apiFetch = mockApi((_path, init) => (init?.method === 'PUT' ? saved : notSaved));
    render(<SobrePage />);

    expect(await screen.findByLabelText('Título')).toHaveValue('Um espaço pra plantar, criar e brindar');
    expect(screen.getByLabelText('Texto do link para o Instagram')).toHaveValue('@daverdinha_');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith('/site-content/about', expect.objectContaining({ method: 'PUT' }));
    const body = apiFetch.mock.calls.at(-1)?.[1]?.body as FormData;
    expect(body.get('title')).toBe('Um espaço pra plantar, criar e brindar');
    expect(body.get('instagramLabel')).toBe('@daverdinha_');
    expect(await screen.findByText(/Alterações salvas/)).toBeInTheDocument();
  });

  it('edits what was saved and can remove the photo', async () => {
    const apiFetch = mockApi((_path, init) => (init?.method === 'PUT' ? { ...saved, imageUrl: null } : saved));
    render(<SobrePage />);

    expect(await screen.findByLabelText('Título')).toHaveValue('Nossa história');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Remover a foto atual' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    const body = apiFetch.mock.calls.at(-1)?.[1]?.body as FormData;
    expect(body.get('removeImage')).toBe('true');
    expect(body.get('instagramLabel')).toBe('');
  });
});
