import type { Metadata } from 'next';
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import './globals.css';

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

export const metadata: Metadata = {
  title: 'Samjho AI',
  description: 'Real-time accessible video conferencing with sign language translation.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const isClerkConfigured = Boolean(clerkPublishableKey && clerkSecretKey);

  if (!isClerkConfigured) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-slate-950 text-white">
          <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
            <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-10 shadow-2xl shadow-black/30">
              <h1 className="text-3xl font-semibold">Clerk is not configured</h1>
              <p className="mt-4 text-sm text-slate-300">
                Add your Clerk keys to <code className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-100">.env.local</code> and restart the dev server.
              </p>
              <pre className="mt-6 overflow-x-auto rounded-2xl bg-slate-950/80 p-4 text-left text-xs text-slate-200">
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
              </pre>
            </div>
          </main>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClerkProvider publishableKey={clerkPublishableKey} signInUrl="/sign-in" signUpUrl="/sign-up">
          <header className="fixed right-4 top-4 z-[70] flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-2 text-sm text-white shadow-xl backdrop-blur-xl">
            <Show when="signed-out">
              <SignInButton key="sign-in-btn" mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
                <button className="rounded-full px-3 py-1 text-white/70 transition-colors hover:text-white">Sign in</button>
              </SignInButton>
              <SignUpButton key="sign-up-btn" mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
                <button className="rounded-full bg-white px-3 py-1 font-medium text-black transition-colors hover:bg-white/90">
                  Sign up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
        </ClerkProvider>
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
