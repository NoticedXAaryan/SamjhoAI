'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { Video, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createMeeting } from '../meetings.actions';

export function HeroCard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState('');
  const [creating, setCreating] = useState(false);

  const displayName = session?.user.name?.split(' ')[0] || 'there';

  async function handleNewMeeting() {
    try {
      setCreating(true);
      const result = await createMeeting();
      router.push(`/meeting/${encodeURIComponent(result.roomName)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create meeting');
    } finally {
      setCreating(false);
    }
  }

  function handleJoinMeeting() {
    const code = meetingCode.trim();
    if (!code) {
      toast.error('Enter a meeting code');
      return;
    }
    router.push(`/meeting/${encodeURIComponent(code)}`);
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950/80 to-slate-900/90 p-8 sm:p-10 shadow-2xl shadow-cyan-500/10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400/80">
            Accessible conference control
          </p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-5xl text-white">
            Welcome back, {displayName}.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Start or join an inclusive live meeting with captions, sign language
            friendly controls, and shared meeting links.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleNewMeeting}
            disabled={creating}
            className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-black shadow-lg shadow-cyan-500/20 hover:bg-cyan-400"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Video className="h-4 w-4 mr-2" />
            )}
            New Meeting
          </Button>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
            <Plus className="h-5 w-5" />
          </div>
          <Input
            value={meetingCode}
            onChange={(e) => setMeetingCode(e.target.value)}
            placeholder="Enter meeting code to join"
            className="bg-black/50 border-white/10"
            onKeyDown={(e) => e.key === 'Enter' && handleJoinMeeting()}
          />
          <Button onClick={handleJoinMeeting} variant="secondary">
            Join
          </Button>
        </div>
      </div>
    </div>
  );
}
