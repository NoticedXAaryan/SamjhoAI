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
import type { AccessibilityPreferences } from '@/features/meetings/meetings.types';

const defaults: AccessibilityPreferences = {
  captionsEnabled: true,
  captionsSize: 'md',
  captionsPosition: 'bottom',
  gestureDisplayEnabled: true,
  highContrast: false,
  preferredLanguage: 'en',
};

interface Props {
  roomName: string;
  title: string;
  token: string;
  serverUrl: string;
  userId: string;
  userName: string;
}

export function MeetingRoom({ roomName, title, token, serverUrl, userId, userName }: Props) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(defaults);

  const stt = useSpeechToText(roomName, userId, userName);

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      audio
      video
      className="h-screen bg-[#050507] text-white flex flex-col overflow-hidden"
      data-lk-theme="default"
    >
      <MeetingTopBar title={title} onToggleSidebar={() => setShowSidebar((v) => !v)} />

      <div className="flex-1 relative flex overflow-hidden">
        <div className="flex-1 relative">
          <VideoGrid />
          <RealtimeCaptions
            enabled={prefs.captionsEnabled}
            size={prefs.captionsSize}
            position={prefs.captionsPosition}
          />
        </div>
        {showSidebar && <ParticipantSidebar onClose={() => setShowSidebar(false)} />}

        {/* Speech captions toggle */}
        <div className="absolute left-4 top-16 z-[80] flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-2 backdrop-blur">
          <span className="text-xs text-white/70">Speech captions</span>
          <Button
            size="sm"
            variant={stt.enabled ? 'secondary' : 'default'}
            onClick={stt.enabled ? stt.stop : stt.start}
          >
            {stt.enabled ? 'Stop' : 'Start'}
          </Button>
        </div>
      </div>

      <ControlBar
        roomName={roomName}
        userId={userId}
        onSettingsOpen={() => setShowSettings(true)}
      />

      <AccessibilitySheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        prefs={prefs}
        onChange={setPrefs}
      />
    </LiveKitRoom>
  );
}
