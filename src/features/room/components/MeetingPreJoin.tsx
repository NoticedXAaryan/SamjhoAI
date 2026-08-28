'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  useMediaDevices,
  usePreviewTracks,
  type LocalUserChoices,
} from '@livekit/components-react';
import { Track, type LocalAudioTrack, type LocalVideoTrack } from 'livekit-client';
import {
  Camera,
  CameraOff,
  ChevronDown,
  Loader2,
  Mic,
  MicOff,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

interface Props {
  roomName: string;
  defaults?: Partial<LocalUserChoices>;
  onSubmit: (choices: LocalUserChoices) => void;
}

function deviceLabel(device: MediaDeviceInfo, index: number, fallback: string) {
  return device.label || `${fallback} ${index + 1}`;
}

export function MeetingPreJoin({ roomName, defaults = {}, onSubmit }: Props) {
  const [username, setUsername] = useState(defaults.username ?? '');
  const [audioEnabled, setAudioEnabled] = useState(defaults.audioEnabled ?? true);
  const [videoEnabled, setVideoEnabled] = useState(defaults.videoEnabled ?? true);
  const [audioDeviceId, setAudioDeviceId] = useState(defaults.audioDeviceId || 'default');
  const [videoDeviceId, setVideoDeviceId] = useState(defaults.videoDeviceId || 'default');
  const [audioError, setAudioError] = useState('');
  const [videoError, setVideoError] = useState('');
  const [environmentError, setEnvironmentError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const describeMediaError = useCallback((error: Error, device: string) => (
      error.name === 'NotAllowedError'
        ? `${device} access is blocked. Allow it in your browser settings and try again.`
        : error.name === 'NotFoundError'
          ? `No ${device.toLowerCase()} was found.`
          : error.name === 'NotReadableError'
            ? `${device} is already in use by another application.`
            : error.message || `${device} could not be started.`
  ), []);

  const handleAudioError = useCallback((error: Error) => {
    setAudioError(describeMediaError(error, 'Microphone'));
  }, [describeMediaError]);
  const handleVideoError = useCallback((error: Error) => {
    setVideoError(describeMediaError(error, 'Camera'));
  }, [describeMediaError]);

  useEffect(() => {
    if (!window.isSecureContext || !navigator.mediaDevices) {
      setEnvironmentError('Camera and microphone access requires HTTPS or localhost in this browser.');
    }
  }, []);

  const audioTracks = usePreviewTracks(
    {
      audio: audioEnabled ? (audioDeviceId === 'default' ? true : { deviceId: audioDeviceId }) : false,
      video: false,
    },
    handleAudioError,
  );
  const videoTracks = usePreviewTracks(
    {
      audio: false,
      video: videoEnabled ? (videoDeviceId === 'default' ? true : { deviceId: videoDeviceId }) : false,
    },
    handleVideoError,
  );
  const microphones = useMediaDevices({ kind: 'audioinput', onError: handleAudioError });
  const cameras = useMediaDevices({ kind: 'videoinput', onError: handleVideoError });

  const videoTrack = useMemo(
    () => videoTracks?.find((track) => track.kind === Track.Kind.Video) as LocalVideoTrack | undefined,
    [videoTracks],
  );
  const audioTrack = useMemo(
    () => audioTracks?.find((track) => track.kind === Track.Kind.Audio) as LocalAudioTrack | undefined,
    [audioTracks],
  );

  useEffect(() => {
    if (audioTrack) setAudioError('');
  }, [audioTrack]);

  useEffect(() => {
    if (videoTrack) setVideoError('');
  }, [videoTrack]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !videoTrack || !videoEnabled) return;
    videoTrack.attach(element);
    return () => {
      videoTrack.detach(element);
    };
  }, [videoEnabled, videoTrack]);

  const normalizedName = username.trim();
  const canJoin = normalizedName.length >= 2 && normalizedName.length <= 80;
  const roomLabel = roomName.replace(/-/g, ' ');

  return (
    <main className="min-h-dvh bg-[#202124] text-white">
      <header className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <BrandLogo className="w-32 sm:w-36" priority />
        <div className="flex items-center gap-2 text-xs font-medium text-white/55 sm:text-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Secure pre-join check
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-64px)] w-full max-w-[1360px] items-center gap-8 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,820px)_360px] lg:justify-center lg:gap-16 lg:px-10">
        <div className="min-w-0">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#111315] shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`h-full w-full scale-x-[-1] object-cover transition-opacity duration-300 ${
                videoEnabled && videoTrack ? 'opacity-100' : 'opacity-0'
              }`}
              aria-label="Camera preview"
            />

            {videoEnabled && !videoTrack && !videoError && !environmentError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Starting your camera…</p>
              </div>
            )}

            {(!videoEnabled || videoError || environmentError) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_center,_#2d3035,_#202124_68%)]">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                  <CameraOff className="h-9 w-9 text-white/65" />
                </div>
                <p className="text-sm font-medium text-white/70">
                  {!videoEnabled ? 'Camera is off' : 'Camera unavailable'}
                </p>
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-5 left-5 max-w-[55%] truncate rounded-lg bg-black/45 px-3 py-1.5 text-sm font-medium backdrop-blur-md">
              {normalizedName || 'Your preview'}
            </div>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
              <button
                type="button"
                aria-label={audioEnabled ? 'Turn off microphone' : 'Turn on microphone'}
                aria-pressed={audioEnabled}
                onClick={() => {
                  setAudioError('');
                  setAudioEnabled((enabled) => !enabled);
                }}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                  audioEnabled
                    ? 'border-white/20 bg-[#3c4043] hover:bg-[#4b4f52]'
                    : 'border-red-500 bg-red-600 hover:bg-red-500'
                }`}
              >
                {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>
              <button
                type="button"
                aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                aria-pressed={videoEnabled}
                onClick={() => {
                  setVideoError('');
                  setVideoEnabled((enabled) => !enabled);
                }}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                  videoEnabled
                    ? 'border-white/20 bg-[#3c4043] hover:bg-[#4b4f52]'
                    : 'border-red-500 bg-red-600 hover:bg-red-500'
                }`}
              >
                {videoEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DeviceSelect
              id="microphone-device"
              label="Microphone"
              icon={<Mic className="h-4 w-4" />}
              value={audioDeviceId}
              devices={microphones}
              fallbackLabel="Microphone"
              onChange={(deviceId) => {
                setAudioError('');
                setAudioDeviceId(deviceId);
              }}
            />
            <DeviceSelect
              id="camera-device"
              label="Camera"
              icon={<Video className="h-4 w-4" />}
              value={videoDeviceId}
              devices={cameras}
              fallbackLabel="Camera"
              onChange={(deviceId) => {
                setVideoError('');
                setVideoDeviceId(deviceId);
              }}
            />
          </div>

          {(environmentError || videoError || audioError) && (
            <div role="alert" className="mt-3 space-y-1 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {environmentError && <p>{environmentError}</p>}
              {videoError && <p>{videoError} You can still join with the camera off.</p>}
              {audioError && <p>{audioError} You can still join muted.</p>}
            </div>
          )}
        </div>

        <form
          className="mx-auto w-full max-w-md px-2 py-6 sm:px-6 lg:max-w-none"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canJoin) return;
            onSubmit({
              username: normalizedName,
              audioEnabled: audioEnabled && Boolean(audioTrack),
              videoEnabled: videoEnabled && Boolean(videoTrack),
              audioDeviceId,
              videoDeviceId,
            });
          }}
        >
          <h1 className="text-center text-[28px] font-normal tracking-tight">Ready to join?</h1>
          <p className="mt-2 truncate text-center text-sm capitalize text-white/50">{roomLabel}</p>

          <label htmlFor="display-name" className="mt-7 block text-sm font-medium text-white/80">
            Your name
          </label>
          <input
            id="display-name"
            name="displayName"
            value={username}
            maxLength={80}
            autoComplete="name"
            autoFocus={!defaults.username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter your name"
            className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-[#0e1013] px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10"
          />
          {normalizedName.length > 0 && normalizedName.length < 2 && (
            <p className="mt-2 text-xs text-amber-300">Enter at least 2 characters.</p>
          )}

          <button
            type="submit"
            disabled={!canJoin}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#8ab4f8] px-5 text-sm font-semibold text-[#202124] transition hover:bg-[#aecbfa] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8ab4f8]/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Video className="h-4 w-4" />
            Join meeting
          </button>

          <p className="mt-5 text-center text-xs leading-relaxed text-white/40">
            Check your camera and microphone before joining. You can change them again inside the meeting.
          </p>
        </form>
      </section>
    </main>
  );
}

function DeviceSelect({
  id,
  label,
  icon,
  value,
  devices,
  fallbackLabel,
  onChange,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  value: string;
  devices: MediaDeviceInfo[];
  fallbackLabel: string;
  onChange: (deviceId: string) => void;
}) {
  const selectedDevice = devices.find((device) => device.deviceId === value);
  const selectedLabel = value === 'default'
    ? `Default ${fallbackLabel.toLowerCase()}`
    : selectedDevice
      ? deviceLabel(selectedDevice, devices.indexOf(selectedDevice), fallbackLabel)
      : fallbackLabel;

  return (
    <label htmlFor={id} className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-[#15171b] px-4 py-3 text-sm transition focus-within:border-cyan-300/50">
      <span className="text-cyan-300">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">{label}</span>
        <span className="block truncate text-white/80">{selectedLabel}</span>
      </span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label={`Select ${label.toLowerCase()}`}
      >
        <option value="default">Default {fallbackLabel.toLowerCase()}</option>
        {devices
          .filter((device) => device.deviceId && device.deviceId !== 'default')
          .map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {deviceLabel(device, index, fallbackLabel)}
            </option>
          ))}
      </select>
      <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />
    </label>
  );
}
