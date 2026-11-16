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
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [creating, setCreating] = useState(false);
  const [scheduling, setScheduling] = useState(false);

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

  async function handleSchedule() {
    if (!startTime) {
      toast.error('Choose a start time');
      return;
    }
    const startsAt = new Date(startTime);
    if (Number.isNaN(startsAt.getTime())) {
      toast.error('That start time is not valid');
      return;
    }
    try {
      setScheduling(true);
      const result = await createMeeting(title.trim() || undefined, startsAt.toISOString());
      const soon = startsAt.getTime() - Date.now() < 15 * 60 * 1000;
      if (soon) {
        router.push(`/meeting/${encodeURIComponent(result.roomName)}`);
        return;
      }
      toast.success('Meeting scheduled');
      setTitle('');
      setStartTime('');
      window.location.assign('/dashboard');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to schedule meeting');
    } finally {
      setScheduling(false);
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
            Start now, schedule a meeting, or join with a code. Captions, a fixed set of hand signs, and guest links are ready in the room.
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

      <div className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 sm:grid-cols-[1fr_220px_auto] sm:items-end">
        <label className="block space-y-1.5 text-sm">
          <span className="text-white/55">Title</span>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Optional meeting title"
            className="bg-black/50 border-white/10"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-white/55">Start time</span>
          <Input
            type="datetime-local"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="bg-black/50 border-white/10"
          />
        </label>
        <Button onClick={() => void handleSchedule()} disabled={scheduling || creating} variant="secondary">
          {scheduling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Schedule
        </Button>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
