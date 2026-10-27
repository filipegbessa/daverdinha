import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: '*.public.blob.vercel-storage.com' }],
  },
  // The admin (including /admin/docs, which maps the whole API) must never
  // show up in search results. A header rather than a robots.txt Disallow:
  // Disallow only stops crawling, and a blocked URL can still be indexed
  // from links pointing at it — without the crawler ever seeing a noindex.
  // next.config headers run before the proxy, so this also lands on the
  // redirect Clerk sends to visitors who aren't logged in.
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
