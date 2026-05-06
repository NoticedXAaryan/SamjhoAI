import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Samjho AI',
  description: 'Real-time accessible video conferencing with sign language translation.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1e1e24',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              borderRadius: '14px',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}
