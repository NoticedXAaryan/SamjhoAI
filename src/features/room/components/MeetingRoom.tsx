'use client';

import '@livekit/components-styles';
import { useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { VideoGrid } from './VideoGrid';
import { MeetingTopBar } from './MeetingTopBar';
import { ParticipantSidebar } from './ParticipantSidebar';
import { ControlBar } from './ControlBar';
import { AccessibilitySheet } from './AccessibilitySheet';
import { RealtimeCaptions } from '@/features/captions/components/RealtimeCaptions';
import { useSpeechToText } from '@/shared/hooks/useSpeechToText';
import { Button } from '@/components/ui/button';

export function MeetingRoom({
  roomName,
  title,
  token,
  serverUrl,
  userId,
  userName,
}: {
  roomName: string;
  title: string;
  token: string;
  serverUrl: string;
  userId: string;
  userName: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);

  const stt = useSpeechToText(roomName, userId, userName);

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      audio
      video
      className="h-screen bg-[#050507] text-white flex flex-col"
      data-lk-theme="default"
    >
      <MeetingTopBar title={title} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      <div className="flex-1 relative flex overflow-hidden">
        <div className="flex-1 relative">
          <VideoGrid />
          <RealtimeCaptions enabled={captionsEnabled} />
        </div>
        {sidebarOpen && <ParticipantSidebar onClose={() => setSidebarOpen(false)} />}

        <div className="absolute left-4 top-16 z-[80] flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-2 backdrop-blur">
          <span className="text-xs text-white/70">Speech captions</span>
          <Button size="sm" variant={stt.enabled ? 'secondary' : 'default'} onClick={stt.enabled ? stt.stop : stt.start}>
            {stt.enabled ? 'Stop' : 'Start'}
          </Button>
        </div>
      </div>

      <ControlBar roomName={roomName} onSettings={() => setSettingsOpen(true)} />

      <AccessibilitySheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        captionsEnabled={captionsEnabled}
        onCaptionsEnabledChange={setCaptionsEnabled}
      />
    </LiveKitRoom>
  );
}

