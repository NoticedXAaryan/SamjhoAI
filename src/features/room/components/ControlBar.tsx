'use client';

import { useState, type ReactNode } from 'react';
import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import {
  Captions,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Settings,
  Users,
  Video,
  VideoOff,
} from 'lucide-react';
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
import { endMeeting } from '@/features/meetings/meetings.actions';
import { useSpeechToText } from '@/shared/hooks/useSpeechToText';
import { cn } from '@/lib/utils';

interface Props {
  roomName: string;
  title: string;
  userId: string;
  userName: string;
  isHost: boolean;
  captionsEnabled: boolean;
  onCaptionsChange: (enabled: boolean) => void;
  onSettingsOpen: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
  onEnding: (ending: boolean) => void;
}

type MediaAction = 'microphone' | 'camera' | 'screen' | null;

export function ControlBar({
  roomName,
  title,
  userId,
  userName,
  isHost,
  captionsEnabled,
  onCaptionsChange,
  onSettingsOpen,
  onToggleParticipants,
  onToggleChat,
  onLeave,
  onEnding,
}: Props) {
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const captions = useSpeechToText(roomName, userId, userName);
  const [ending, setEnding] = useState(false);
  const [pendingAction, setPendingAction] = useState<MediaAction>(null);
  const [mediaError, setMediaError] = useState('');

  async function toggleMedia(action: Exclude<MediaAction, null>, change: () => Promise<unknown>) {
    if (pendingAction) return;
    setPendingAction(action);
    setMediaError('');
    try {
      await change();
    } catch (error) {
      const device = action === 'microphone' ? 'Microphone' : action === 'camera' ? 'Camera' : 'Screen sharing';
      setMediaError(
        error instanceof Error && error.name === 'NotAllowedError'
          ? `${device} permission is blocked in this browser.`
          : `${device} could not be started. Check the selected device and browser permissions.`,
      );
    } finally {
      setPendingAction(null);
    }
  }

  function toggleCaptions() {
    const nextEnabled = !captionsEnabled;
    onCaptionsChange(nextEnabled);
    if (nextEnabled) captions.start();
    else captions.stop();
  }

  async function handleEnd() {
    setEnding(true);
    setMediaError('');
    onEnding(true);
    try {
      await endMeeting(roomName);
      window.location.assign(`/meeting/${encodeURIComponent(roomName)}/summary`);
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : 'Could not end the meeting.');
      setEnding(false);
      onEnding(false);
    }
  }

  return (
    <TooltipProvider delayDuration={250}>
      <footer className="relative z-50 flex min-h-20 shrink-0 items-center justify-between gap-3 bg-[#202124] px-3 py-3 sm:px-5">
        <div className="hidden min-w-0 flex-1 md:block">
          <p className="truncate text-sm font-medium text-white/90">{title}</p>
          <p className="mt-0.5 text-xs text-white/45">{roomName}</p>
        </div>

        <div className="flex flex-1 items-center justify-center gap-2 md:flex-none">
          <ControlButton
            label={isMicrophoneEnabled ? 'Turn off microphone' : 'Turn on microphone'}
            danger={!isMicrophoneEnabled}
            pressed={isMicrophoneEnabled}
            disabled={pendingAction === 'microphone'}
            onClick={() => void toggleMedia('microphone', () => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled))}
          >
            {isMicrophoneEnabled ? <Mic /> : <MicOff />}
          </ControlButton>
          <ControlButton
            label={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
            danger={!isCameraEnabled}
            pressed={isCameraEnabled}
            disabled={pendingAction === 'camera'}
            onClick={() => void toggleMedia('camera', () => localParticipant.setCameraEnabled(!isCameraEnabled))}
          >
            {isCameraEnabled ? <Video /> : <VideoOff />}
          </ControlButton>
          <ControlButton
            label={captionsEnabled ? 'Turn off captions' : 'Turn on captions'}
            active={captionsEnabled}
            pressed={captionsEnabled}
            onClick={toggleCaptions}
          >
            <Captions />
          </ControlButton>
          <ControlButton
            label={isScreenShareEnabled ? 'Stop presenting' : 'Present now'}
            active={isScreenShareEnabled}
            pressed={isScreenShareEnabled}
            disabled={pendingAction === 'screen'}
            onClick={() => void toggleMedia('screen', () => localParticipant.setScreenShareEnabled(!isScreenShareEnabled))}
          >
            <MonitorUp />
          </ControlButton>
          <ControlButton label="Leave call" danger wide onClick={onLeave}>
            <PhoneOff />
          </ControlButton>
        </div>

        <div className="hidden flex-1 items-center justify-end gap-1 sm:flex">
          <ControlButton label={`Participants (${participants.length})`} onClick={onToggleParticipants}>
            <Users />
          </ControlButton>
          <ControlButton label="Meeting chat" onClick={onToggleChat}>
            <MessageSquare />
          </ControlButton>
          <ControlButton label="Meeting settings" onClick={onSettingsOpen}>
            <Settings />
          </ControlButton>
          {isHost && (
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-11 w-11 rounded-full text-white/75 hover:bg-white/10 hover:text-white" aria-label="End meeting for everyone">
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>End for everyone</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End this meeting?</AlertDialogTitle>
                  <AlertDialogDescription>The room closes for everyone and the transcript is saved.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Stay</AlertDialogCancel>
                  <AlertDialogAction disabled={ending} onClick={handleEnd} className="bg-destructive hover:bg-destructive/90">
                    {ending ? 'Ending…' : 'End for everyone'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {(mediaError || captions.error) && (
          <p role="alert" className="absolute bottom-[calc(100%+8px)] left-1/2 w-[min(92vw,560px)] -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2.5 text-center text-sm text-white shadow-xl">
            {mediaError || captions.error}
          </p>
        )}
      </footer>
    </TooltipProvider>
  );
}

function ControlButton({
  children,
  label,
  onClick,
  danger,
  active,
  pressed,
  wide,
  disabled,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
  pressed?: boolean;
  wide?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          aria-pressed={pressed}
          className={cn(
            'h-11 w-11 rounded-full bg-[#3c4043] text-white hover:bg-[#4a4d51] [&_svg]:h-5 [&_svg]:w-5',
            danger && 'bg-[#d93025] hover:bg-[#ea4335]',
            active && 'bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]',
            wide && 'w-16',
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
