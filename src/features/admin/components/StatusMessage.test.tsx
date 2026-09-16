import { render, screen } from '@testing-library/react';
import { ErrorAlert, ErrorText, LoadingState } from './StatusMessage';

describe('StatusMessage', () => {
  it('announces loading as a status, not an alert', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
  });

  it('lets the caller name what is loading', () => {
    render(<LoadingState label="Carregando conversas..." />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando conversas...');
  });

  it('announces both error shapes as alerts so screen readers interrupt', () => {
    const { unmount } = render(<ErrorAlert>Deu ruim</ErrorAlert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Deu ruim');
    unmount();

    render(<ErrorText>Deu ruim de novo</ErrorText>);
    expect(screen.getByRole('alert')).toHaveTextContent('Deu ruim de novo');
  });

  it('keeps every error on the palette instead of a raw red', () => {
    render(<ErrorAlert>Deu ruim</ErrorAlert>);
    expect(screen.getByRole('alert')).toHaveClass('text-berry');
  });
});
