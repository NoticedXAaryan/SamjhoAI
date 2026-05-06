import { useMemo } from 'react';

export type CaptionEntry = {
  id: string;
  type: 'speech' | 'sign';
  text: string;
  userId: string;
};

export function CaptionsOverlay({ captions }: { captions: CaptionEntry[] }) {
  const visibleCaptions = useMemo(() => captions.slice(-3), [captions]);

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[min(92vw,680px)] -translate-x-1/2 rounded-3xl bg-black/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
      {visibleCaptions.map((caption) => (
        <div
          key={caption.id}
          className={`mb-2 rounded-2xl border px-4 py-3 text-sm ${
            caption.type === 'sign' ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100' : 'border-white/10 bg-white/5 text-white'
          }`}
        >
          <div className="truncate font-semibold">{caption.type === 'sign' ? 'Sign detected' : 'Speech'}</div>
          <p className="mt-1 leading-snug">{caption.text}</p>
        </div>
      ))}
    </div>
  );
}
