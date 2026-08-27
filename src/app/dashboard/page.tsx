'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { Calendar } from 'lucide-react';
import { DashboardHeader } from '@/features/meetings/components/DashboardHeader';
import { HeroCard } from '@/features/meetings/components/HeroCard';
import { MeetingCard } from '@/features/meetings/components/MeetingCard';
import { MeetingCardSkeleton } from '@/features/meetings/components/MeetingCardSkeleton';
import { PastMeetingRow } from '@/features/meetings/components/PastMeetingRow';
import { getUpcomingMeetings, getPastMeetings } from '@/features/meetings/meetings.actions';
import type { Meeting } from '@/features/meetings/meetings.types';

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [past, setPast] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending || !session?.user) return;
    (async () => {
      try {
        setLoading(true);
        const [up, pa] = await Promise.all([getUpcomingMeetings(), getPastMeetings()]);
        setUpcoming(up);
        setPast(pa);
      } catch {
        // Silently handle — user sees empty state
      } finally {
        setLoading(false);
      }
    })();
  }, [isPending, session]);

  if (isPending) {
    return (
      <main className="min-h-screen bg-[#050507] text-white flex items-center justify-center px-4">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-8 text-center shadow-lg shadow-cyan-500/10">
          <p className="text-sm text-white/70">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <DashboardHeader />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-10">
        <HeroCard />

        {/* Upcoming Meetings */}
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-white/50" />
            Upcoming Meetings
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <MeetingCardSkeleton />
              <MeetingCardSkeleton />
              <MeetingCardSkeleton />
            </div>
          ) : upcoming.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map((m) => (
                <MeetingCard key={m.id} meeting={m} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-black/30 py-12 text-center">
              <Calendar className="mx-auto mb-3 h-10 w-10 text-white/20" />
              <p className="text-sm text-white/40">No upcoming meetings</p>
              <p className="text-xs text-white/25 mt-1">Start a new meeting from the hero card above</p>
            </div>
          )}
        </section>

        {/* Past Meetings */}
        {past.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Past Meetings</h2>
            <div className="space-y-2">
              {past.map((m) => (
                <PastMeetingRow key={m.id} meeting={m} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
