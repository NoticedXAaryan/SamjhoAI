import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'abc-defg-hij' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({ data: null, isPending: false }),
}));

vi.mock('@/features/room/components/MeetingPreJoin', () => ({
  MeetingPreJoin: ({ onSubmit }: { onSubmit: (choices: object) => void }) => (
    <button
      type="button"
      onClick={() => onSubmit({
        username: 'Guest User',
        audioEnabled: true,
        videoEnabled: true,
        audioDeviceId: 'default',
        videoDeviceId: 'default',
      })}
    >
      Join once
    </button>
  ),
}));

vi.mock('@/features/room/components/MeetingRoom', () => ({
  MeetingRoom: () => <div>Connected room</div>,
}));

import MeetingPage from '../page';

describe('MeetingPage', () => {
  it('requests exactly one token for one join action', async () => {
    vi.stubEnv('NEXT_PUBLIC_LIVEKIT_URL', 'ws://localhost:7880');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'token-1',
        title: 'Test meeting',
        isHost: false,
        userId: 'guest-1',
        userName: 'Guest User',
      }),
    } as Response);

    render(<MeetingPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Join once' }));

    await waitFor(() => expect(screen.getByText('Connected room')).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockRestore();
  });
});
