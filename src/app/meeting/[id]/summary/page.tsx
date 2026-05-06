import Link from 'next/link';
import { getTranscript } from '@/features/captions/captions.actions';
import { DownloadTranscriptButton } from './transcript.client';

export const dynamic = 'force-dynamic';

export default async function SummaryPage({ params }: { params: { id: string } }) {
  const roomName = params.id;
  const segments = await getTranscript(roomName);

  const text = segments
    .map((s) => {
      const t = new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${t}  ${s.userName}: ${s.content}`;
    })
    .join('\n');

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Meeting summary</h1>
            <p className="text-sm text-white/60 mt-1">Room: {roomName}</p>
          </div>
          <div className="flex items-center gap-2">
            <DownloadTranscriptButton filename={`${roomName}.txt`} content={text} />
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-md bg-white/10 px-4 text-sm font-medium hover:bg-white/15 transition-colors"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
          <div className="border-b border-white/10 px-5 py-3 text-sm text-white/70">
            Transcript ({segments.length})
          </div>
          <div className="p-5 space-y-3">
            {segments.length === 0 ? (
              <p className="text-sm text-white/60">No transcript saved yet.</p>
            ) : (
              segments.map((s, idx) => (
                <div key={`${s.timestamp}-${idx}`} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium truncate">{s.userName}</p>
                    <p className="text-xs text-white/50 shrink-0">
                      {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-white/80 whitespace-pre-wrap">{s.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

