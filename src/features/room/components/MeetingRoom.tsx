'use client';

import '@livekit/components-styles';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  useConnectionState,
  Chat,
  type LocalUserChoices,
} from '@livekit/components-react';
import { ConnectionError, ConnectionState, DisconnectReason, type MediaDeviceFailure } from 'livekit-client';
import { VideoGrid } from './VideoGrid';
import { MeetingTopBar } from './MeetingTopBar';
import { ParticipantSidebar } from './ParticipantSidebar';
import { ControlBar } from './ControlBar';
import { AccessibilitySheet } from './AccessibilitySheet';
import { RealtimeCaptions } from '@/features/captions/components/RealtimeCaptions';
import { Button } from '@/components/ui/button';
import type { AccessibilityPreferences } from '@/shared/lib/types';
import { cn } from '@/lib/utils';

const defaults: AccessibilityPreferences = {
  captionsEnabled: false,
  captionsSize: 'md',
  captionsPosition: 'bottom',
  gestureDisplayEnabled: false,
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
  const [roomAttempt, setRoomAttempt] = useState(0);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [retryAllowed, setRetryAllowed] = useState(true);
  const [disconnectMessage, setDisconnectMessage] = useState('');
  const [mediaWarning, setMediaWarning] = useState('');
  const everConnected = useRef(false);
  const intentionalDisconnect = useRef(false);
  const lastConnectionError = useRef('');

  const audioCapture = useMemo(() => {
    if (!userChoices.audioEnabled) return false;
    return userChoices.audioDeviceId && userChoices.audioDeviceId !== 'default'
      ? { deviceId: userChoices.audioDeviceId }
      : true;
  }, [userChoices.audioDeviceId, userChoices.audioEnabled]);

  const videoCapture = useMemo(() => {
    if (!userChoices.videoEnabled) return false;
    return userChoices.videoDeviceId && userChoices.videoDeviceId !== 'default'
      ? { deviceId: userChoices.videoDeviceId }
      : true;
  }, [userChoices.videoDeviceId, userChoices.videoEnabled]);

  const handleConnected = useCallback(() => {
    everConnected.current = true;
    setConnectionFailed(false);
    setRetryAllowed(true);
    setDisconnectMessage('');
    lastConnectionError.current = '';
  }, []);

  const handleError = useCallback((error: Error) => {
    if (error instanceof ConnectionError) {
      lastConnectionError.current = error.message;
      return;
    }
    setMediaWarning(error.message || 'A camera or microphone could not be started.');
  }, []);

  const handleDisconnected = useCallback((reason?: DisconnectReason) => {
    if (intentionalDisconnect.current) return;
    const roomEnded = reason === DisconnectReason.ROOM_DELETED;
    setConnectionFailed(true);
    setRetryAllowed(!roomEnded);
    setDisconnectMessage(
      roomEnded
        ? 'The host ended this meeting.'
        : everConnected.current
        ? 'The connection to the meeting was lost. You can retry without creating a new meeting.'
        : lastConnectionError.current || 'The meeting server could not be reached. Check the LiveKit URL and network access.',
    );
  }, []);

  const handleMediaDeviceFailure = useCallback((_failure?: MediaDeviceFailure, kind?: MediaDeviceKind) => {
    const device = kind === 'videoinput' ? 'camera' : kind === 'audioinput' ? 'microphone' : 'media device';
    setMediaWarning(`Your ${device} could not be started. Check browser permissions or choose another device in Settings.`);
  }, []);

  const leaveMeeting = useCallback(() => {
    intentionalDisconnect.current = true;
    router.push(returnHref);
  }, [returnHref, router]);

  const retryConnection = useCallback(() => {
    everConnected.current = false;
    intentionalDisconnect.current = false;
    lastConnectionError.current = '';
    setConnectionFailed(false);
    setRetryAllowed(true);
    setDisconnectMessage('');
    setRoomAttempt((attempt) => attempt + 1);
  }, []);

  return (
    <LiveKitRoom
      key={roomAttempt}
      token={token}
      serverUrl={serverUrl}
      connect
      audio={audioCapture}
      video={videoCapture}
      options={{ adaptiveStream: true, dynacast: true }}
      onConnected={handleConnected}
      onDisconnected={handleDisconnected}
      onError={handleError}
      onMediaDeviceFailure={handleMediaDeviceFailure}
      className={cn('flex h-dvh flex-col overflow-hidden bg-[#202124] text-white', prefs.highContrast && 'contrast-125')}
      data-lk-theme="default"
    >
      <RoomAudioRenderer />
      <StartAudio label="Enable meeting audio" />
      <ConnectionNotice />
      <MeetingTopBar
        title={title}
        roomName={roomName}
        onToggleParticipants={() => { setShowSidebar((v) => !v); setShowChat(false); }}
        onToggleChat={() => { setShowChat((v) => !v); setShowSidebar(false); }}
        onSettingsOpen={() => setShowSettings(true)}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="relative min-w-0 flex-1">
          <VideoGrid />
          <RealtimeCaptions
            enabled={prefs.captionsEnabled}
            size={prefs.captionsSize}
            position={prefs.captionsPosition}
          />
        </div>
        {showSidebar && <ParticipantSidebar onClose={() => setShowSidebar(false)} />}
        {showChat && (
          <aside className="absolute inset-y-2 right-2 z-40 flex w-[min(360px,calc(100vw-16px))] shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#292a2d] shadow-2xl lg:static lg:inset-auto lg:my-2 lg:mr-2">
            <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
              <p className="text-sm font-medium">In-call messages</p>
              <button type="button" className="text-xs text-white/55 hover:text-white" onClick={() => setShowChat(false)}>Close</button>
            </div>
            <Chat channelTopic="samjho-chat" />
          </aside>
        )}
      </div>

      <ControlBar
        roomName={roomName}
        title={title}
        userId={userId}
        userName={userName}
        isHost={isHost}
        captionsEnabled={prefs.captionsEnabled}
        onCaptionsChange={(enabled) => setPrefs((current) => ({ ...current, captionsEnabled: enabled }))}
        onSettingsOpen={() => setShowSettings(true)}
        onToggleParticipants={() => { setShowSidebar((v) => !v); setShowChat(false); }}
        onToggleChat={() => { setShowChat((v) => !v); setShowSidebar(false); }}
        onLeave={leaveMeeting}
        onEnding={(ending) => { intentionalDisconnect.current = ending; }}
      />

      <AccessibilitySheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        prefs={prefs}
        onChange={setPrefs}
      />
      {mediaWarning && !connectionFailed && (
        <div role="alert" className="absolute left-1/2 top-16 z-[110] flex w-[min(92vw,640px)] -translate-x-1/2 items-center justify-between gap-3 rounded-lg bg-amber-400 px-4 py-2.5 text-sm text-black shadow-xl">
          <span>{mediaWarning}</span>
          <button type="button" className="font-semibold" onClick={() => setMediaWarning('')}>Dismiss</button>
        </div>
      )}
      {connectionFailed && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/85 p-6 text-center">
          <div className="max-w-md rounded-2xl border border-white/10 bg-[#292a2d] p-8 shadow-2xl">
            <h2 className="text-xl font-semibold">Couldn’t connect to the meeting</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">{disconnectMessage}</p>
            <div className="mt-6 flex justify-center gap-3">
              {retryAllowed && <Button onClick={retryConnection}>Try again</Button>}
              <Button variant="secondary" onClick={leaveMeeting}>Leave</Button>
            </div>
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
