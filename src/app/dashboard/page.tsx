'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import { Calendar, Copy, MonitorUp, Plus, Sparkles, Video, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Meeting = {
  id: string;
  title: string;
  startsAt: string | Date;
  roomName: string;
};

export default function DashboardPage() {
  const { isLoaded, user } = useUser();
  const [meetingCode, setMeetingCode] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  const displayName = user?.firstName || user?.fullName || 'there';

  const now = useMemo(() => new Date(), []);
  const upcoming = useMemo(
    () => meetings.filter((m) => new Date(m.startsAt).getTime() >= now.getTime()),
    [meetings, now]
  );

  useEffect(() => {
    if (!isLoaded || !user) return;
    (async () => {
      try {
        setLoadingMeetings(true);
        const resp = await fetch('/api/meetings', { method: 'GET' });
        const data = (await resp.json()) as { upcoming?: Meeting[]; past?: Meeting[]; error?: string };
        if (!resp.ok) throw new Error(data.error || 'Failed to load meetings');
        const merged = [...(data.upcoming ?? []), ...(data.past ?? [])];
        setMeetings(merged);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load meetings');
      } finally {
        setLoadingMeetings(false);
      }
    })();
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-[#050507] text-white flex items-center justify-center px-4">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-8 text-center shadow-lg shadow-cyan-500/10">
          <p className="text-sm text-white/70">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  const createMeeting = async () => {
    try {
      const resp = await fetch('/api/meetings', { method: 'POST', headers: { 'content-type': 'application/json' } });
      const data = (await resp.json()) as { meeting?: Meeting; error?: string };
      if (!resp.ok || !data.meeting) throw new Error(data.error || 'Failed to create meeting');
      window.location.href = `/meeting/${encodeURIComponent(data.meeting.roomName)}`;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create meeting');
    }
  };

  const joinMeeting = () => {
    const roomName = meetingCode.trim();
    if (!roomName) {
      toast.error('Enter a meeting code');
      return;
    }
    window.location.href = `/meeting/${encodeURIComponent(roomName)}`;
  };

  const copyMeeting = (roomName: string) => {
    const url = `${window.location.origin}/meeting/${roomName}`;
    void navigator.clipboard.writeText(url);
    toast.success('Meeting link copied');
  };

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-cyan-glow" />
            Samjho AI
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm text-white/60 hidden sm:block">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950/80 to-slate-900/90 p-10 shadow-2xl shadow-cyan-500/10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400/80">Accessible conference control</p>
              <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
                Welcome back, {displayName}.
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-300">
                Start or join an inclusive live meeting with captions, sign language friendly controls, and shared meeting links.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={createMeeting} className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-black shadow-lg shadow-cyan-500/20 hover:bg-cyan-400">
                Start a Meeting
              </Button>
              <Button variant="secondary" onClick={createMeeting}>
                New meeting link
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-10 xl:grid-cols-[1.3fr_0.9fr]">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={createMeeting}
              className="group flex flex-col items-center justify-center gap-4 rounded-3xl bg-cyan-500/10 p-8 text-center transition-all hover:bg-cyan-500/20 active:scale-95"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 transition-transform group-hover:scale-105">
                <Video className="h-8 w-8" />
              </div>
              <span className="font-medium text-cyan-50">New Meeting</span>
            </button>

            <div className="flex flex-col gap-4">
              <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl bg-white/[0.03] p-6 text-center border border-white/5 transition-all hover:bg-white/[0.05]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="w-full space-y-3">
                  <span className="font-medium">Join Meeting</span>
                  <div className="flex gap-2">
                    <Input
                      value={meetingCode}
                      onChange={(e) => setMeetingCode(e.target.value)}
                      placeholder="Enter code"
                      className="bg-black/50 border-white/10 text-center"
                    />
                    <Button onClick={joinMeeting} variant="secondary">
                      Join
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <button className="group flex flex-col items-center justify-center gap-4 rounded-3xl bg-white/[0.03] p-8 text-center border border-white/5 transition-all hover:bg-white/[0.05] active:scale-95">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 transition-transform group-hover:scale-105">
                <Calendar className="h-8 w-8" />
              </div>
              <span className="font-medium">Schedule</span>
            </button>

            <button className="group flex flex-col items-center justify-center gap-4 rounded-3xl bg-white/[0.03] p-8 text-center border border-white/5 transition-all hover:bg-white/[0.05] active:scale-95">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 transition-transform group-hover:scale-105">
                <MonitorUp className="h-8 w-8" />
              </div>
              <span className="font-medium">Share Screen</span>
            </button>
          </section>

          <aside className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="border-b border-white/10 p-6 bg-black/20">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-white/50" />
                Upcoming
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {upcoming.map((meeting) => {
                const date = new Date(meeting.startsAt);
                return (
                  <div key={meeting.id} className="group relative flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/40 p-4 transition-all hover:bg-white/[0.04]">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-white/60">
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="mt-1 font-semibold text-white/90">{meeting.title}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button onClick={() => (window.location.href = `/meeting/${meeting.roomName}`)} size="sm" className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                        Start
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => copyMeeting(meeting.roomName)} title="Copy Invitation">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {!loadingMeetings && upcoming.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center text-white/40 pb-8">
                  <Calendar className="mb-3 h-10 w-10 opacity-20" />
                  <p>No upcoming meetings today</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
