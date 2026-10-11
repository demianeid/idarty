/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  async headers() {
    return [{ source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'X-Frame-Options', value: 'DENY' }, { key: 'X-DNS-Prefetch-Control', value: 'off' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'Strict-Transport-Security', value: 'max-age=63072000' }, { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }] }]
  },
}

export default nextConfig
