'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LogOut, Mic, MicOff, Video, VideoOff, MonitorUp, Settings, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { endMeeting } from '@/features/meetings/meetings.actions';

interface Props {
  roomName: string;
  isHost: boolean;
  onSettingsOpen: () => void;
}

export function ControlBar({ roomName, isHost, onSettingsOpen }: Props) {
  const router = useRouter();
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const [ending, setEnding] = useState(false);
  const [mediaError, setMediaError] = useState('');

  const handleLeave = async () => {
    await room.disconnect();
    router.push('/dashboard');
  };

  const handleEnd = async () => {
    setEnding(true);
    setMediaError('');
    try {
      await endMeeting(roomName);
      router.push(`/meeting/${encodeURIComponent(roomName)}/summary`);
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : 'Could not end the meeting.');
      setEnding(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-20 border-t border-white/10 bg-black/50 backdrop-blur-xl flex items-center justify-center gap-3 px-6 shrink-0">
        <Btn
          label={isMicrophoneEnabled ? 'Mute' : 'Unmute'}
          danger={!isMicrophoneEnabled}
          onClick={async () => {
            try { await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled); }
            catch { setMediaError('Microphone access failed. Check your browser permissions.'); }
          }}
        >
          {isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Btn>

        <Btn
          label={isCameraEnabled ? 'Stop camera' : 'Start camera'}
          danger={!isCameraEnabled}
          onClick={async () => {
            try { await localParticipant.setCameraEnabled(!isCameraEnabled); }
            catch { setMediaError('Camera access failed. Check your browser permissions.'); }
          }}
        >
          {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Btn>

        <Btn
          label={isScreenShareEnabled ? 'Stop sharing' : 'Share screen'}
          accent={isScreenShareEnabled}
          onClick={async () => {
            try {
              await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
            } catch {
              setMediaError('Screen sharing was cancelled or blocked.');
            }
          }}
        >
          <MonitorUp className="h-5 w-5" />
        </Btn>

        <div className="h-8 w-px bg-white/10" />

        <Btn label="Accessibility settings" onClick={onSettingsOpen}>
          <Settings className="h-5 w-5" />
        </Btn>

        <Btn label="Leave meeting" onClick={handleLeave} danger>
          <LogOut className="h-5 w-5" />
        </Btn>

        {isHost && <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="destructive"
              className="h-12 w-12 rounded-full ml-2"
              aria-label="End call"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End this meeting?</AlertDialogTitle>
              <AlertDialogDescription>
                The meeting ends for everyone and a transcript is saved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Stay</AlertDialogCancel>
              <AlertDialogAction
                disabled={ending}
                onClick={handleEnd}
                className="bg-destructive hover:bg-destructive/90"
              >
                {ending ? 'Ending…' : 'End for everyone'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>}
        {mediaError && <p role="alert" className="absolute bottom-20 rounded bg-destructive px-3 py-2 text-sm text-white">{mediaError}</p>}
      </div>
    </TooltipProvider>
  );
}

// Internal sub-component — not exported (no reason for it to be)
function Btn({
  children,
  label,
  onClick,
  danger,
  accent,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void | Promise<void>;
  danger?: boolean;
  accent?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClick}
          aria-label={label}
          className={cn(
            'h-12 w-12 rounded-full',
            danger && 'bg-destructive/15 text-destructive hover:bg-destructive/25',
            accent && 'bg-primary/15 text-primary hover:bg-primary/25',
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
