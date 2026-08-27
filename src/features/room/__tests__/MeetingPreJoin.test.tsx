import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const preview = vi.hoisted(() => {
  const videoTrack = {
    kind: 'video',
    attach: vi.fn(),
    detach: vi.fn(),
  };
  return {
    videoTrack,
    tracks: [videoTrack],
    usePreviewTracks: vi.fn(),
    useMediaDevices: vi.fn(),
  };
});

vi.mock('@livekit/components-react', () => ({
  usePreviewTracks: preview.usePreviewTracks,
  useMediaDevices: preview.useMediaDevices,
}));

vi.mock('livekit-client', () => ({
  Track: { Kind: { Video: 'video' } },
}));

vi.mock('@/components/brand/BrandLogo', () => ({
  BrandLogo: () => <div>Samjho AI</div>,
}));

import { MeetingPreJoin } from '../components/MeetingPreJoin';

const cameras = [
  { deviceId: 'camera-1', label: 'Built-in camera' },
  { deviceId: 'camera-2', label: 'USB camera' },
] as MediaDeviceInfo[];
const microphones = [
  { deviceId: 'microphone-1', label: 'Built-in microphone' },
  { deviceId: 'microphone-2', label: 'USB microphone' },
] as MediaDeviceInfo[];

describe('MeetingPreJoin', () => {
  it('previews media and submits the selected devices and toggles', () => {
    preview.usePreviewTracks.mockReturnValue(preview.tracks);
    preview.useMediaDevices.mockImplementation(({ kind }: { kind: MediaDeviceKind }) =>
      kind === 'videoinput' ? cameras : microphones,
    );
    const onSubmit = vi.fn();

    render(
      <MeetingPreJoin
        roomName="meeting-design-review"
        defaults={{ username: 'Aaryan', audioEnabled: true, videoEnabled: true }}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByLabelText('Camera preview')).toBeTruthy();
    expect(preview.videoTrack.attach).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Select camera'), {
      target: { value: 'camera-2' },
    });
    fireEvent.change(screen.getByLabelText('Select microphone'), {
      target: { value: 'microphone-2' },
    });
    fireEvent.click(screen.getByLabelText('Turn off camera'));
    fireEvent.click(screen.getByLabelText('Turn off microphone'));

    expect(screen.getByText('Camera is off')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Join meeting' }));

    expect(onSubmit).toHaveBeenCalledWith({
      username: 'Aaryan',
      audioEnabled: false,
      videoEnabled: false,
      audioDeviceId: 'microphone-2',
      videoDeviceId: 'camera-2',
    });
  });

  it('requires a usable display name before joining', () => {
    preview.usePreviewTracks.mockReturnValue(preview.tracks);
    preview.useMediaDevices.mockReturnValue([]);

    render(
      <MeetingPreJoin
        roomName="meeting-name-check"
        defaults={{ username: '' }}
        onSubmit={vi.fn()}
      />,
    );

    const joinButton = screen.getByRole('button', { name: 'Join meeting' }) as HTMLButtonElement;
    expect(joinButton.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'A' } });
    expect(screen.getByText('Enter at least 2 characters.')).toBeTruthy();
    expect(joinButton.disabled).toBe(true);
  });
});
