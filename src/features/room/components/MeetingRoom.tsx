'use client';

import '@livekit/components-styles';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  useConnectionState,
  Chat,
  type LocalUserChoices,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { VideoGrid } from './VideoGrid';
import { MeetingTopBar } from './MeetingTopBar';
import { ParticipantSidebar } from './ParticipantSidebar';
import { ControlBar } from './ControlBar';
import { AccessibilitySheet } from './AccessibilitySheet';
import { RealtimeCaptions } from '@/features/captions/components/RealtimeCaptions';
import { useSpeechToText } from '@/shared/hooks/useSpeechToText';
import { Button } from '@/components/ui/button';
import type { AccessibilityPreferences } from '@/shared/lib/types';

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
  isHost: boolean;
  returnHref: string;
  userChoices: LocalUserChoices;
}

export function MeetingRoom({ roomName, title, token, serverUrl, userId, userName, isHost, returnHref, userChoices }: Props) {
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(defaults);
  const [disconnected, setDisconnected] = useState(false);

  const stt = useSpeechToText(roomName, userId, userName);

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      audio={userChoices.audioEnabled ? { deviceId: userChoices.audioDeviceId } : false}
      video={userChoices.videoEnabled ? { deviceId: userChoices.videoDeviceId } : false}
      onConnected={() => setDisconnected(false)}
      onDisconnected={() => setDisconnected(true)}
      className="h-screen bg-[#050507] text-white flex flex-col overflow-hidden"
      data-lk-theme="default"
    >
      <RoomAudioRenderer />
      <StartAudio label="Enable meeting audio" />
      <ConnectionNotice />
      <MeetingTopBar
        title={title}
        onToggleSidebar={() => { setShowSidebar((v) => !v); setShowChat(false); }}
        onToggleChat={() => { setShowChat((v) => !v); setShowSidebar(false); }}
      />

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
        {showChat && (
          <aside className="w-80 shrink-0 border-l border-white/10 bg-black/70">
            <Chat channelTopic="samjho-chat" />
          </aside>
        )}

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
        isHost={isHost}
        returnHref={returnHref}
        onSettingsOpen={() => setShowSettings(true)}
      />

      <AccessibilitySheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        prefs={prefs}
        onChange={setPrefs}
      />
      {disconnected && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/85 p-6 text-center">
          <div className="max-w-md rounded-2xl border border-white/10 bg-slate-950 p-8">
            <h2 className="text-xl font-semibold">Meeting disconnected</h2>
            <p className="mt-2 text-sm text-white/60">The host may have ended the meeting, or the connection could not be restored.</p>
            <Button className="mt-6" onClick={() => router.push(returnHref)}>Leave meeting</Button>
          </div>
        </div>
      )}
    </LiveKitRoom>
  );
}

function ConnectionNotice() {
  const state = useConnectionState();
  if (state === ConnectionState.Connected) return null;

  return (
    <div role="status" className="absolute left-1/2 top-3 z-[100] -translate-x-1/2 rounded-full bg-amber-500/90 px-4 py-2 text-sm font-medium text-black">
      {state === ConnectionState.Reconnecting ? 'Reconnecting to the meeting…' : 'Connecting to the meeting…'}
    </div>
  );
}
