import { render, screen } from '@testing-library/react';
import DocsPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');
jest.mock('@/features/admin/components/ApiDocsViewer', () => ({
  ApiDocsViewer: ({ spec }: { spec: { info: { title: string } } }) => <p>viewer: {spec.info.title}</p>,
}));

describe('DocsPage', () => {
  it('fetches the spec through the authenticated client and renders it', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ info: { title: 'Daverdinha API' } });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<DocsPage />);

    expect(await screen.findByText('viewer: Daverdinha API')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/openapi.json');
  });

  it('shows the error instead of the viewer when the spec fails to load', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Erro 401'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<DocsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro 401');
    expect(screen.queryByText(/viewer:/)).not.toBeInTheDocument();
  });
});
