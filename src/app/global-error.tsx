'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
          <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
          <p className="mb-6 text-slate-300">{error.message}</p>
          <button
            onClick={() => reset()}
            className="rounded-full bg-white px-6 py-2 font-medium text-black transition-colors hover:bg-slate-200"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
