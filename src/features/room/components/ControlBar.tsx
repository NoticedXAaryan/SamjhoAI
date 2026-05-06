'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, MonitorUp, PhoneOff, Settings, Video, VideoOff } from 'lucide-react';

export function ControlBar({
  roomName,
  onSettings,
}: {
  roomName: string;
  onSettings: () => void;
}) {
  const router = useRouter();
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const [sharing, setSharing] = useState(false);
  const [ending, setEnding] = useState(false);

  async function toggleShare() {
    try {
      await localParticipant?.setScreenShareEnabled(!sharing);
      setSharing((v) => !v);
    } catch {
      // User cancelled
    }
  }

  async function endCall() {
    if (ending) return;
    setEnding(true);
    await room.disconnect();
    router.push(`/meeting/${encodeURIComponent(roomName)}/summary`);
  }

  return (
    <div className="h-20 border-t border-white/10 bg-black/50 backdrop-blur-xl flex items-center justify-center gap-3 px-4">
      <Button
        size="icon"
        variant={isMicrophoneEnabled ? 'secondary' : 'destructive'}
        className="h-12 w-12 rounded-full"
        onClick={() => localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled)}
        aria-label={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        {isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>

      <Button
        size="icon"
        variant={isCameraEnabled ? 'secondary' : 'destructive'}
        className="h-12 w-12 rounded-full"
        onClick={() => localParticipant?.setCameraEnabled(!isCameraEnabled)}
        aria-label={isCameraEnabled ? 'Stop camera' : 'Start camera'}
      >
        {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>

      <Button
        size="icon"
        variant={sharing ? 'default' : 'secondary'}
        className="h-12 w-12 rounded-full"
        onClick={toggleShare}
        aria-label={sharing ? 'Stop screen share' : 'Start screen share'}
      >
        <MonitorUp className="h-5 w-5" />
      </Button>

      <div className="mx-2 h-8 w-px bg-white/10" />

      <Button size="icon" variant="secondary" className="h-12 w-12 rounded-full" onClick={onSettings} aria-label="Settings">
        <Settings className="h-5 w-5" />
      </Button>

      <Button
        size="icon"
        variant="destructive"
        className="h-12 w-12 rounded-full ml-2"
        onClick={endCall}
        aria-label="End call"
        disabled={ending}
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}

