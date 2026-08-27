import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import './globals.css';

const metadataBase = new URL(process.env.BETTER_AUTH_URL ?? 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase,
  applicationName: 'Samjho AI',
  title: {
    default: 'Samjho AI',
    template: '%s | Samjho AI',
  },
  description: 'Real-time accessible video conferencing with live captions.',
  keywords: ['accessible video conferencing', 'live captions', 'sign language', 'realtime meetings'],
  openGraph: {
    type: 'website',
    title: 'Samjho AI',
    description: 'Accessible video meetings with realtime captions, chat, and transcripts.',
    siteName: 'Samjho AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Samjho AI',
    description: 'Accessible video meetings with realtime captions, chat, and transcripts.',
  },
};

export const viewport: Viewport = {
  themeColor: '#050507',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthHeader />
        {children}
        <Toaster position="top-center" toastOptions={{ style: { background: '#1e1e24', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '14px', fontSize: '14px' } }} />
      </body>
    </html>
  );
}
