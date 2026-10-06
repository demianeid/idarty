import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Idarty',
    short_name: 'Idarty',
    description: 'A calm, secure workspace for managing tenants, bookings, and teams.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#0B0B0F',
    background_color: '#FFFFFF',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
