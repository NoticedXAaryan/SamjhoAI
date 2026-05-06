'use client';

import { Button } from '@/components/ui/button';

export function AccessibilitySheet({
  open,
  onClose,
  captionsEnabled,
  onCaptionsEnabledChange,
}: {
  open: boolean;
  onClose: () => void;
  captionsEnabled: boolean;
  onCaptionsEnabledChange: (v: boolean) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[min(90vw,360px)] border-l border-white/10 bg-black/70 backdrop-blur-xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/90">Accessibility</h2>
          <button className="text-xs text-white/60 hover:text-white" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Live captions</p>
              <p className="text-xs text-white/60">Show captions overlay for the room.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onCaptionsEnabledChange(!captionsEnabled)}>
              {captionsEnabled ? 'On' : 'Off'}
            </Button>
          </div>

          <p className="text-xs text-white/50">
            More controls (size/position/contrast) are planned, but this MVP focuses on reliable realtime captions + transcript saving.
          </p>
        </div>
      </div>
    </div>
  );
}

