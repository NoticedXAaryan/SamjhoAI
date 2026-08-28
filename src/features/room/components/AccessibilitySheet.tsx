'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { Room, RoomEvent } from 'livekit-client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { AccessibilityPreferences } from '@/shared/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  prefs: AccessibilityPreferences;
  onChange: (p: AccessibilityPreferences) => void;
}

export function AccessibilitySheet({ open, onClose, prefs, onChange }: Props) {
  const room = useRoomContext();
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeMicrophone, setActiveMicrophone] = useState('default');
  const [activeCamera, setActiveCamera] = useState('default');
  const [deviceError, setDeviceError] = useState('');
  const set = <K extends keyof AccessibilityPreferences>(key: K) => (val: AccessibilityPreferences[K]) =>
    onChange({ ...prefs, [key]: val });

  const refreshDevices = useCallback(async () => {
    try {
      const devices = await Room.getLocalDevices(undefined, false);
      setMicrophones(devices.filter((device) => device.kind === 'audioinput'));
      setCameras(devices.filter((device) => device.kind === 'videoinput'));
      setActiveMicrophone(room.getActiveDevice('audioinput') || 'default');
      setActiveCamera(room.getActiveDevice('videoinput') || 'default');
      setDeviceError('');
    } catch (error) {
      setDeviceError(error instanceof Error ? error.message : 'Could not read media devices.');
    }
  }, [room]);

  useEffect(() => {
    if (!open) return;
    void refreshDevices();
    room.on(RoomEvent.MediaDevicesChanged, refreshDevices);
    return () => {
      room.off(RoomEvent.MediaDevicesChanged, refreshDevices);
    };
  }, [open, refreshDevices, room]);

  async function switchDevice(kind: 'audioinput' | 'videoinput', deviceId: string) {
    setDeviceError('');
    try {
      await room.switchActiveDevice(kind, deviceId, false);
      if (kind === 'audioinput') setActiveMicrophone(deviceId);
      else setActiveCamera(deviceId);
    } catch (error) {
      setDeviceError(error instanceof Error ? error.message : `Could not switch ${kind === 'audioinput' ? 'microphone' : 'camera'}.`);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-80 bg-card border-border">
        <SheetHeader>
          <SheetTitle>Meeting settings</SheetTitle>
          <SheetDescription>Choose your devices and personalise the meeting.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Section label="Devices">
            <DeviceRow
              label="Microphone"
              value={activeMicrophone}
              devices={microphones}
              fallback="Microphone"
              onChange={(deviceId) => void switchDevice('audioinput', deviceId)}
            />
            <DeviceRow
              label="Camera"
              value={activeCamera}
              devices={cameras}
              fallback="Camera"
              onChange={(deviceId) => void switchDevice('videoinput', deviceId)}
            />
            {deviceError && <p role="alert" className="text-xs text-destructive">{deviceError}</p>}
          </Section>

          <Separator />

          <Section label="Captions">
            <Row label="Enable live captions">
              <Switch
                checked={prefs.captionsEnabled}
                onCheckedChange={set('captionsEnabled')}
              />
            </Row>
            {prefs.captionsEnabled && (
              <>
                <Row label="Size">
                  <Pick
                    value={prefs.captionsSize}
                    onChange={set('captionsSize')}
                    options={[
                      ['sm', 'Small'],
                      ['md', 'Medium'],
                      ['lg', 'Large'],
                    ]}
                  />
                </Row>
                <Row label="Position">
                  <Pick
                    value={prefs.captionsPosition}
                    onChange={set('captionsPosition')}
                    options={[
                      ['top', 'Top'],
                      ['bottom', 'Bottom'],
                    ]}
                  />
                </Row>
              </>
            )}
          </Section>

          <Separator />

          <Section label="Gestures">
            <Row label="Show gesture recognition">
              <Switch
                checked={prefs.gestureDisplayEnabled}
                onCheckedChange={set('gestureDisplayEnabled')}
              />
            </Row>
          </Section>

          <Separator />

          <Section label="Visual">
            <Row label="High contrast">
              <Switch checked={prefs.highContrast} onCheckedChange={set('highContrast')} />
            </Row>
          </Section>

          <Separator />

          <Section label="Language">
            <Row label="Speech language">
              <Pick
                value={prefs.preferredLanguage}
                onChange={set('preferredLanguage')}
                options={[
                  ['en', 'English'],
                  ['es', 'Spanish'],
                  ['fr', 'French'],
                  ['de', 'German'],
                  ['hi', 'Hindi'],
                  ['ja', 'Japanese'],
                ]}
              />
            </Row>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DeviceRow({
  label,
  value,
  devices,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  devices: MediaDeviceInfo[];
  fallback: string;
  onChange: (deviceId: string) => void;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="default">Default {fallback.toLowerCase()}</option>
        {devices
          .filter((device) => device.deviceId && device.deviceId !== 'default')
          .map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `${fallback} ${index + 1}`}
            </option>
          ))}
      </select>
    </label>
  );
}

// Private layout helpers — not exported, not reused elsewhere
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
        {label}
      </p>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm font-normal">{label}</Label>
      {children}
    </div>
  );
}

function Pick<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <Select value={value} onValueChange={(nextValue) => onChange(nextValue as T)}>
      <SelectTrigger className="w-28 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
