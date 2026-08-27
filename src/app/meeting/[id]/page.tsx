'use client';

import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PreJoin, type LocalUserChoices } from '@livekit/components-react';
import { MeetingRoom as MeetingRoomShell } from '@/features/room/components/MeetingRoom';
import { useSession } from '@/lib/auth-client';

export default function MeetingPage() {
  const params = useParams();
  const roomName = (params.id as string) || 'room';
  const { data: session, isPending } = useSession();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [title, setTitle] = useState(roomName);
  const [isHost, setIsHost] = useState(false);
  const [userChoices, setUserChoices] = useState<LocalUserChoices | null>(null);
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  useEffect(() => {
    if (isPending || !session?.user || !userChoices) return;
    if (!serverUrl) {
      setError('LiveKit server URL is not configured. Check NEXT_PUBLIC_LIVEKIT_URL.');
      return;
    }

    (async () => {
      try {
        const resp = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ roomName }),
        });
        const data = await resp.json();
        if (resp.ok && data.token) {
          setToken(data.token);
          setTitle(data.title || roomName);
          setIsHost(Boolean(data.isHost));
        } else {
          setError(data.error || 'No token returned from LiveKit token API.');
        }
      } catch {
        setError('Failed to fetch LiveKit token.');
      }
    })();
  }, [session, isPending, roomName, serverUrl, userChoices]);

  if (!error && !isPending && session?.user && !userChoices) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050507] p-4 text-white" data-lk-theme="default">
        <PreJoin
          defaults={{ username: session.user.name, audioEnabled: true, videoEnabled: true }}
          joinLabel="Join meeting"
          onSubmit={setUserChoices}
          onError={(preJoinError) => setError(preJoinError.message)}
        />
      </main>
    );
  }

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
      title={title}
      token={token}
      serverUrl={serverUrl}
      userId={session?.user.id ?? 'unknown'}
      userName={session?.user.name ?? 'User'}
      isHost={isHost}
      userChoices={userChoices!}
    />
  );
}
