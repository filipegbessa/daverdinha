/**
 * @jest-environment node
 *
 * jsdom doesn't expose the web-standard Request/Response globals that
 * NextRequest is built on; the Node test environment does.
 */
import { NextRequest } from 'next/server';
import proxy, { config, isProtectedRoute } from './proxy';

describe('isProtectedRoute', () => {
  it('matches /admin and any nested path', () => {
    expect(isProtectedRoute(new NextRequest('http://localhost/admin'))).toBe(true);
    expect(isProtectedRoute(new NextRequest('http://localhost/admin/menu'))).toBe(true);
    expect(isProtectedRoute(new NextRequest('http://localhost/admin/conversas/abc-123'))).toBe(true);
  });

  it('does not match the public homepage, login, or privacy policy', () => {
    expect(isProtectedRoute(new NextRequest('http://localhost/'))).toBe(false);
    expect(isProtectedRoute(new NextRequest('http://localhost/login'))).toBe(false);
    expect(isProtectedRoute(new NextRequest('http://localhost/politica-de-privacidade'))).toBe(false);
  });
});

describe('proxy', () => {
  it('is the default export Next 16 runs before every page and API route', () => {
    expect(typeof proxy).toBe('function');
    expect(config.matcher).toContain('/(api|trpc)(.*)');
  });
});
