import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

export const isProtectedRoute = createRouteMatcher(['/admin(.*)']);

// Next 16: o antigo `middleware` agora é `proxy` e roda sempre no runtime
// Node.js. O `clerkMiddleware` do @clerk/nextjs 7 já procura este arquivo.
const proxy = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default proxy;

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'],
};
