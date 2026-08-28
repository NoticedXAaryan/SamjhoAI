import { act, render, screen } from '@testing-library/react';
import { createContext, useContext, type PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';

const mockRoomContext = createContext(false);
const liveKit = vi.hoisted(() => ({ props: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@livekit/components-react', () => ({
    LiveKitRoom: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => {
      liveKit.props(props);
      return <mockRoomContext.Provider value>{children}</mockRoomContext.Provider>;
    },
    RoomAudioRenderer: () => null,
    StartAudio: () => null,
    Chat: () => null,
    useConnectionState: () => 'connected',
    useLocalParticipant: () => ({ cameraTrack: undefined, isCameraEnabled: false }),
    useRoomContext: () => {
      if (!useContext(mockRoomContext)) {
        throw new Error('Try to access room content outside of the LiveKit room component');
      }
      return { localParticipant: { publishData: vi.fn() } };
    },
}));

vi.mock('livekit-client', () => ({
  ConnectionError: class ConnectionError extends Error {},
  ConnectionState: { Connected: 'connected', Disconnected: 'disconnected', Reconnecting: 'reconnecting' },
  DisconnectReason: { ROOM_DELETED: 5 },
}));

vi.mock('@/features/captions/captions.actions', () => ({
  saveCaptionSegment: vi.fn(),
}));
vi.mock('@/features/captions/components/RealtimeCaptions', () => ({
  RealtimeCaptions: () => null,
}));
vi.mock('../components/VideoGrid', () => ({ VideoGrid: () => null }));
vi.mock('../components/MeetingTopBar', () => ({ MeetingTopBar: () => null }));
vi.mock('../components/ParticipantSidebar', () => ({ ParticipantSidebar: () => null }));
vi.mock('../components/ControlBar', () => ({ ControlBar: () => null }));
vi.mock('../components/AccessibilitySheet', () => ({ AccessibilitySheet: () => null }));

import { MeetingRoom } from '../components/MeetingRoom';

describe('MeetingRoom', () => {
  it('renders LiveKit context consumers beneath the room provider', () => {
    expect(() =>
      render(
        <MeetingRoom
          roomName="meeting-test1234"
          title="Test meeting"
          token="test-token"
          serverUrl="ws://localhost:7880"
          userId="user-1"
          userName="Test User"
          isHost
          returnHref="/dashboard"
          userChoices={{
            username: 'Test User',
            audioEnabled: false,
            videoEnabled: false,
            audioDeviceId: '',
            videoDeviceId: '',
          }}
        />,
      ),
    ).not.toThrow();

    expect(screen.queryByText('Couldn’t connect to the meeting')).toBeNull();
    expect(liveKit.props).toHaveBeenCalledWith(expect.objectContaining({ audio: false, video: false }));
  });

  it('only presents a retry after an actual disconnect event', () => {
    render(
      <MeetingRoom
        roomName="abc-defg-hij"
        title="Test meeting"
        token="test-token"
        serverUrl="ws://localhost:7880"
        userId="user-1"
        userName="Test User"
        isHost={false}
        returnHref="/"
        userChoices={{
          username: 'Test User',
          audioEnabled: true,
          videoEnabled: true,
          audioDeviceId: 'default',
          videoDeviceId: 'default',
        }}
      />,
    );

    expect(screen.queryByText('Couldn’t connect to the meeting')).toBeNull();
    const roomProps = liveKit.props.mock.lastCall?.[0] as { onDisconnected: () => void; audio: unknown; video: unknown };
    expect(roomProps.audio).toBe(true);
    expect(roomProps.video).toBe(true);

    act(() => roomProps.onDisconnected());

    expect(screen.getByText('Couldn’t connect to the meeting')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('does not offer a retry after the host ends the room', () => {
    render(
      <MeetingRoom
        roomName="abc-defg-hij"
        title="Test meeting"
        token="test-token"
        serverUrl="ws://localhost:7880"
        userId="user-1"
        userName="Test User"
        isHost={false}
        returnHref="/"
        userChoices={{
          username: 'Test User',
          audioEnabled: false,
          videoEnabled: false,
          audioDeviceId: '',
          videoDeviceId: '',
        }}
      />,
    );

    const roomProps = liveKit.props.mock.lastCall?.[0] as { onDisconnected: (reason?: number) => void };
    act(() => roomProps.onDisconnected(5));

    expect(screen.getByText('The host ended this meeting.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });
});
