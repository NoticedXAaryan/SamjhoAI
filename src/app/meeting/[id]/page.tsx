'use client';

import '@livekit/components-styles';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { LocalUserChoices } from '@livekit/components-react';
import { MeetingRoom as MeetingRoomShell } from '@/features/room/components/MeetingRoom';
import { MeetingPreJoin } from '@/features/room/components/MeetingPreJoin';
import { useSession } from '@/lib/auth-client';

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const roomName = (params.id as string) || 'room';
  const { data: session, isPending } = useSession();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [title, setTitle] = useState(roomName);
  const [isHost, setIsHost] = useState(false);
  const [userChoices, setUserChoices] = useState<LocalUserChoices | null>(null);
  const [participant, setParticipant] = useState<{ userId: string; userName: string } | null>(null);
  const [joining, setJoining] = useState(false);
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  async function joinMeeting(choices: LocalUserChoices) {
    if (joining) return;
    setJoining(true);
    setError('');
    setUserChoices(choices);

    if (!serverUrl) {
      setError('LiveKit server URL is not configured. Check NEXT_PUBLIC_LIVEKIT_URL.');
      setJoining(false);
      return;
    }

    try {
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ roomName, displayName: choices.username }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token) {
        throw new Error(data.error || 'The meeting could not be joined.');
      }

      setTitle(data.title || roomName);
      setIsHost(Boolean(data.isHost));
      setParticipant({ userId: data.userId, userName: data.userName });
      setToken(data.token);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Failed to join the meeting.');
    } finally {
      setJoining(false);
    }
  }

  function resetJoin() {
    setError('');
    setToken('');
    setParticipant(null);
    setUserChoices(null);
  }

  if (!error && !isPending && !userChoices && !joining) {
    return (
      <MeetingPreJoin
        roomName={roomName}
        defaults={{ username: session?.user.name || '', audioEnabled: true, videoEnabled: true }}
        onSubmit={joinMeeting}
      />
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#050507] text-white px-4 text-center">
        <p className="text-lg font-semibold">Unable to join meeting</p>
        <p className="mt-2 max-w-xl text-sm text-white/70">{error}</p>
        <div className="mt-6 flex gap-3">
          <button className="rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950" onClick={resetJoin}>Try again</button>
          <button className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold" onClick={() => router.push(session?.user ? '/dashboard' : '/')}>Leave</button>
        </div>
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

  if (joining || token === '' || !participant || !userChoices) {
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
      userId={participant.userId}
      userName={participant.userName}
      isHost={isHost}
      returnHref={session?.user ? '/dashboard' : '/'}
      userChoices={userChoices}
    />
  );
}
