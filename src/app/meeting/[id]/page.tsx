'use client';

import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { MeetingRoom as MeetingRoomShell } from '@/features/room/components/MeetingRoom';
import { useUser } from '@clerk/nextjs';

export default function MeetingPage() {
  const params = useParams();
  const roomName = (params.id as string) || 'room';
  const { user, isLoaded } = useUser();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!serverUrl) {
      setError('LiveKit server URL is not configured. Check NEXT_PUBLIC_LIVEKIT_URL.');
      return;
    }

    (async () => {
      try {
        const resp = await fetch(`/api/livekit/token?room=${encodeURIComponent(roomName)}`);
        const data = await resp.json();
        if (data.token) {
          setToken(data.token);
        } else {
          setError(data.error || 'No token returned from LiveKit token API.');
          console.error('No token returned:', data.error);
        }
      } catch (e) {
        setError('Failed to fetch LiveKit token.');
        console.error('Failed to fetch token', e);
      }
    })();
  }, [user, isLoaded, roomName, serverUrl]);

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#050507] text-white px-4 text-center">
        <p className="text-lg font-semibold">Unable to join meeting</p>
        <p className="mt-2 max-w-xl text-sm text-white/70">{error}</p>
      </div>
    );
  }

  if (!serverUrl) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#050507] text-white px-4 text-center">
        <p className="text-lg font-semibold">Unable to join meeting</p>
        <p className="mt-2 max-w-xl text-sm text-white/70">Missing NEXT_PUBLIC_LIVEKIT_URL.</p>
      </div>
    );
  }

  if (token === '') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#050507] text-white">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-sm text-white/60">Joining secure room...</p>
      </div>
    );
  }

  return (
    <MeetingRoomShell
      roomName={roomName}
      title={roomName}
      token={token}
      serverUrl={serverUrl}
      userId={user?.id ?? 'unknown'}
      userName={user?.fullName ?? user?.firstName ?? 'User'}
    />
  );
}
