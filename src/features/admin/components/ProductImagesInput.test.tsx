import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductImagesInput, validateImages } from './ProductImagesInput';

const photo = (name: string, type = 'image/jpeg', size = 1000) => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

function Harness({ currentImages = [] as string[], onChange = jest.fn() }) {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <ProductImagesInput
      currentImages={currentImages}
      files={files}
      onChange={(next) => {
        setFiles(next);
        onChange(next);
      }}
    />
  );
}

describe('validateImages', () => {
  it('accepts up to six JPEG, PNG or WebP photos of up to 5 MB', () => {
    expect(validateImages([photo('a.jpg'), photo('b.png', 'image/png'), photo('c.webp', 'image/webp')])).toBeNull();
  });

  it('refuses more than six photos', () => {
    expect(validateImages(Array.from({ length: 7 }, (_, i) => photo(`${i}.jpg`)))).toBe('Escolha no máximo 6 fotos.');
  });

  it('names the file with the wrong type or size', () => {
    expect(validateImages([photo('a.gif', 'image/gif')])).toBe('"a.gif" precisa ser JPEG, PNG ou WebP.');
    expect(validateImages([photo('big.jpg', 'image/jpeg', 6 * 1024 * 1024)])).toBe('"big.jpg" passa de 5 MB.');
  });
});

describe('ProductImagesInput', () => {
  beforeAll(() => {
    URL.createObjectURL = jest.fn((file: Blob) => `blob:${(file as File).name}`);
    URL.revokeObjectURL = jest.fn();
  });

  it('shows the current photos and warns that new ones replace them', () => {
    render(<Harness currentImages={['https://blob/1.jpg', 'https://blob/2.jpg']} />);

    expect(screen.getByRole('list', { name: 'Fotos atuais' })).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getByText(/Escolher novas fotos substitui as atuais/)).toBeInTheDocument();
  });

  it('previews the chosen photos in place of the current ones', async () => {
    const onChange = jest.fn();
    render(<Harness currentImages={['https://blob/1.jpg']} onChange={onChange} />);

    await userEvent.upload(screen.getByLabelText('Fotos'), [photo('nova.jpg')]);

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'nova.jpg' })]);
    expect(screen.getByRole('list', { name: 'Fotos novas' })).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:nova.jpg');
  });

  it('rejects an invalid choice without keeping any file', async () => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.upload(screen.getByLabelText('Fotos'), [photo('grande.jpg', 'image/jpeg', 6 * 1024 * 1024)]);

    expect(screen.getByRole('alert')).toHaveTextContent('"grande.jpg" passa de 5 MB.');
    expect(screen.getByLabelText('Fotos')).toHaveAccessibleDescription(expect.stringContaining('passa de 5 MB'));
    expect(screen.getByLabelText('Fotos')).toHaveAttribute('aria-invalid', 'true');
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
