import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Samjho AI',
    short_name: 'Samjho',
    description: 'Accessible video meetings with realtime captions, chat, and transcripts.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050507',
    theme_color: '#050507',
    icons: [
      {
        src: '/brand/samjho-ai-mark-transparent.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
    ],
  };
}
