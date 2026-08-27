import { render, screen } from '@testing-library/react';
import { createContext, useContext, type PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';

const mockRoomContext = createContext(false);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@livekit/components-react', () => ({
    LiveKitRoom: ({ children }: PropsWithChildren) => (
      <mockRoomContext.Provider value>{children}</mockRoomContext.Provider>
    ),
    RoomAudioRenderer: () => null,
    StartAudio: () => null,
    Chat: () => null,
    useConnectionState: () => 'connected',
    useRoomContext: () => {
      if (!useContext(mockRoomContext)) {
        throw new Error('Try to access room content outside of the LiveKit room component');
      }
      return { localParticipant: { publishData: vi.fn() } };
    },
}));

vi.mock('livekit-client', () => ({
  ConnectionState: { Connected: 'connected', Reconnecting: 'reconnecting' },
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

    expect(screen.getByText('Speech captions')).toBeTruthy();
  });
});
