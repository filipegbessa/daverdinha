import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductGallery } from './ProductGallery';

const images = ['https://x.public.blob.vercel-storage.com/a.jpg', 'https://x.public.blob.vercel-storage.com/b.jpg'];

describe('ProductGallery', () => {
  it('switches the main photo from the thumbnails', async () => {
    render(<ProductGallery images={images} name="Vaso M" />);

    await userEvent.click(screen.getByRole('button', { name: 'Ver foto 2 de 2' }));
    expect(screen.getByRole('button', { name: 'Ver foto 2 de 2' })).toHaveAttribute('aria-current', 'true');
  });

  it('opens the photo full screen and goes through the photos', async () => {
    render(<ProductGallery images={images} name="Vaso M" />);

    await userEvent.click(screen.getByRole('button', { name: 'Ampliar foto' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('1 / 2')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Próxima foto' }));
    expect(within(dialog).getByText('2 / 2')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowRight}');
    expect(within(dialog).getByText('1 / 2')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has nothing to zoom without photos', () => {
    render(<ProductGallery images={[]} name="Vaso M" />);
    expect(screen.queryByRole('button', { name: 'Ampliar foto' })).not.toBeInTheDocument();
  });
});
