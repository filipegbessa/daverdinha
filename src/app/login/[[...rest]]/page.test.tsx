import { render, screen } from '@testing-library/react';
import LoginPage from './page';

jest.mock('@clerk/nextjs', () => ({
  SignIn: (props: { path: string; routing: string; forceRedirectUrl: string }) => (
    <div data-testid="clerk-sign-in" data-path={props.path} data-after={props.forceRedirectUrl} />
  ),
}));

describe('LoginPage', () => {
  it('renders Clerk SignIn scoped to /login, redirecting to /admin after success', () => {
    render(<LoginPage />);
    const signIn = screen.getByTestId('clerk-sign-in');
    expect(signIn).toHaveAttribute('data-path', '/login');
    expect(signIn).toHaveAttribute('data-after', '/admin');
  });
});
