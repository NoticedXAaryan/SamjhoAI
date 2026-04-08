import { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import {
  Video, Calendar, Keyboard, Clock, Settings, LogOut, Check,
  Link as LinkIcon, Copy, X, Plus, ChevronLeft, ChevronRight, Sparkles,
  Mic, History, User, Trash2, MoreVertical, ArrowRight, Zap, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, addMonths, subMonths, isToday,
} from 'date-fns';
import { meetingsApi, authApi, auth, type Meeting } from '../lib/api';
import type { User as UserType } from '../lib/api';
import { AvatarPicker, AvatarIcon } from '../components/AvatarIcons';
import { useMediaDevices } from '../lib/useMediaDevices';
import { toast } from 'sonner';

/* ── helpers ─────────────────────────────────────────────────────────── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function safeParseDate(raw: string | undefined | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function meetingStatus(m: Meeting) {
  const start = safeParseDate(m.scheduledStartAt);
  if (!start) return { label: 'Unknown', color: 'text-white/30 bg-transparent border-white/5' };
  const end = new Date(start.getTime() + 3600_000);
  const now = Date.now();
  if (m.status === 'COMPLETED') return { label: 'Completed', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
  if (m.status === 'ACTIVE') return { label: 'Live', color: 'text-red-400 bg-red-400/10 border-red-400/20 animate-pulse' };
  if (start.getTime() <= now && now <= end.getTime()) return { label: 'Started', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' };
  if (start.getTime() < now) return { label: 'Past', color: 'text-white/30 bg-transparent border-white/5' };
  const diff = start.getTime() - now;
  if (diff < 10 * 60_000) return { label: 'Starting soon', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20 animate-pulse' };
  return { label: 'Upcoming', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20' };
}

/* ── tiny reusable card wrapper with GSAP hover ─────────────────────── */
function HoverCard({ children, className, onClick }: {
  children: React.ReactNode; className?: string; onClick?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(); }}
      className={className}
      onMouseEnter={() => {
        if (prefersReducedMotion || !cardRef.current) return;
        gsap.to(cardRef.current, { scale: 1.025, y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.45)', duration: 0.28, ease: 'power2.out', overwrite: 'auto' });
      }}
      onMouseLeave={() => {
        if (prefersReducedMotion || !cardRef.current) return;
        gsap.to(cardRef.current, { scale: 1, y: 0, boxShadow: 'none', duration: 0.4, ease: 'elastic.out(1,0.8)' });
      }}
    >
      {children}
    </div>
  );
}

/* ── Memoized calendar grid — safe date parsing, pre-computed maps ─ */
const CalendarGrid = forwardRef<HTMLDivElement, {
  currentMonth: Date;
  upcomingMeetings: Meeting[];
  pastMeetings: Meeting[];
  onDayClick: (dateStr: string) => void;
  onJoin: (id: string) => void;
}>(({ currentMonth, upcomingMeetings, pastMeetings, onDayClick, onJoin }, ref) => {
  const days = useMemo(
    () => eachDayOfInterval({
      start: startOfWeek(startOfMonth(currentMonth)),
      end: endOfWeek(endOfMonth(currentMonth)),
    }),
    [currentMonth],
  );

  const upcomingByDay = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    upcomingMeetings.forEach(m => {
      const d = safeParseDate(m.scheduledStartAt);
      if (!d) return;
      const key = format(d, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return map;
  }, [upcomingMeetings]);

  const pastDays = useMemo(() => {
    const set = new Set<string>();
    pastMeetings.forEach(m => {
      const d = safeParseDate(m.scheduledStartAt);
      if (d) set.add(format(d, 'yyyy-MM-dd'));
    });
    return set;
  }, [pastMeetings]);

  const now = Date.now();

  return (
    <div ref={ref} className="flex-1 min-h-0 flex flex-col bg-black/20 rounded-xl overflow-hidden border border-white/10">
      <div className="grid grid-cols-7 gap-px bg-white/10 shrink-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-[#111] p-3 text-center text-sm font-medium text-[#86868b]">{day}</div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 gap-px bg-white/10 overflow-y-auto">
        {days.map((day, i) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayMeetings = upcomingByDay.get(dayKey) || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          const hasPastMeetings = pastDays.has(dayKey);
          const isPastDay = day.getTime() < now && isCurrentMonth;
          const maxShow = 2;
          const overflow = dayMeetings.length - maxShow;

          return (
            <div
              key={i}
              className={`bg-[#0a0a0a] min-h-[100px] p-2 transition-colors hover:bg-white/5 group relative ${!isCurrentMonth ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isTodayDate ? 'bg-blue-500 text-white' : isPastDay ? 'bg-white/10 text-white/50 line-through' : 'text-white/80'}`}>
                  {format(day, 'd')}
                </span>
                {isCurrentMonth && (
                  <button
                    onClick={() => onDayClick(format(day, 'yyyy-MM-dd'))}
                    className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-1 overflow-hidden">
                {dayMeetings.slice(0, maxShow).map(meeting => (
                  <div
                    key={meeting.id}
                    onClick={() => onJoin(meeting.id)}
                    className="text-[11px] p-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 truncate cursor-pointer hover:bg-blue-500/20 transition-colors"
                  >
                    {new Date(meeting.scheduledStartAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {meeting.title}
                  </div>
                ))}
                {overflow > 0 && (
                  <div className="text-[10px] text-white/40 px-1.5">+{overflow} more</div>
                )}
                {dayMeetings.length === 0 && hasPastMeetings && isCurrentMonth && (
                  <div className="text-[9px] text-white/20 px-1.5">Past meeting</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
CalendarGrid.displayName = 'CalendarGrid';

/* ── main page ───────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Data
  const [user, setUser] = useState<UserType | null>(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<Meeting[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarAnimDir, setCalendarAnimDir] = useState<'left' | 'right'>('right'); // used in navigateMonth for GSAP direction

  // View
  const [activeView, setActiveView] = useState<'meetings' | 'calendar' | 'settings'>('meetings');
  const prevViewRef = useRef(activeView);

  // Modals
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduledLink, setScheduledLink] = useState('');
  const [meetingCode, setMeetingCode] = useState('');

  // ── email verification & avatar ──────
  const [emailBannerDismissed, setEmailBannerDismissed] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

  // ── mount animations — GSAP after DOM settles ─────────────────────
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = requestAnimationFrame(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      // Use fromTo so StrictMode double-mount doesn't leave elements hidden
      if (sidebarRef.current) {
        tl.fromTo(sidebarRef.current, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45 }, 0);
      }
      if (headerRef.current) {
        tl.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, 0.1);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // ── clock ─────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── load user + meetings ──────────────────────────────────────────
  useEffect(() => {
    authApi.me().then((u) => {
      auth.setUser(u);
      setUser(u);
      setAuthChecked(true);
      return meetingsApi.list().catch(() => [] as Meeting[]);
    }).then((data) => {
      const upcoming = data.filter(m => {
        const s = new Date(m.scheduledStartAt);
        return s.getTime() >= Date.now() && m.status !== 'COMPLETED';
      }).sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime());
      const past = data.filter(m => {
        const s = new Date(m.scheduledStartAt);
        return s.getTime() < Date.now() || m.status === 'COMPLETED';
      }).sort((a, b) => new Date(b.scheduledStartAt).getTime() - new Date(a.scheduledStartAt).getTime());
      setUpcomingMeetings(upcoming);
      setPastMeetings(past);
    }).catch(() => {
      auth.clear();
      navigate('/auth');
    }).finally(() => {
      setMeetingsLoading(false);
    });
  }, [navigate]);

  if (!authChecked) return null;

  // ── view transition ───────────────────────────────────────────────
  const switchView = useCallback((view: 'meetings' | 'calendar' | 'settings') => {
    setActiveView(view);
    prevViewRef.current = view;
  }, []);

  // ── calendar navigation with animation ────────────────────────────
  const navigateMonth = useCallback((dir: 1 | -1) => {
    setCalendarAnimDir(dir > 0 ? 'right' : 'left');
    setCurrentMonth((prev) => {
      const next = dir > 0 ? addMonths(prev, 1) : subMonths(prev, 1);
      if (!calendarRef.current) return next;
      gsap.to(calendarRef.current, {
        opacity: 0, x: dir * -30, duration: 0.2, onComplete: () => {
          setCalendarAnimDir(_ => dir > 0 ? 'right' : 'left');
          gsap.fromTo(calendarRef.current!, { opacity: 0, x: dir * 30 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' });
        },
      });
      return next;
    });
  }, []);

  // ── actions ───────────────────────────────────────────────────────
  const handleNewMeeting = async () => {
    try {
      const meeting = await meetingsApi.create({
        title: 'Instant Meeting',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().substring(0, 5),
      });
      navigate(`/meeting?id=${meeting.id}`);
    } catch {
      navigate(`/meeting?id=${Math.random().toString(36).substring(2, 12)}`);
    }
  };

  const handleCreateLink = async () => {
    try {
      const meeting = await meetingsApi.create({
        title: 'Shared Meeting Link',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().substring(0, 5),
      });
      setGeneratedLink(`${window.location.origin}/meeting?id=${meeting.id}`);
    } catch {
      setGeneratedLink(`${window.location.origin}/meeting?id=${Math.random().toString(36).substring(2, 12)}`);
    }
    setIsLinkModalOpen(true);
    setCopied(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copied to clipboard');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTitle || !scheduleDate || !scheduleTime) return;
    try {
      const meeting = await meetingsApi.create({ title: scheduleTitle, date: scheduleDate, time: scheduleTime });
      const updated = [...upcomingMeetings, meeting]
        .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime());
      setUpcomingMeetings(updated);
      setScheduledLink(`${window.location.origin}/meeting?id=${meeting.id}`);
    } catch {
      const id = Math.random().toString(36).substring(2, 12);
      setScheduledLink(`${window.location.origin}/meeting?id=${id}`);
    }
    setScheduleSuccess(true);
  };

  const closeScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setTimeout(() => {
      setScheduleTitle(''); setScheduleDate(''); setScheduleTime('');
      setScheduleSuccess(false); setScheduledLink(''); setCopied(false);
    }, 300);
  };

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingCode.trim()) return;
    let id = meetingCode.trim();
    try { if (id.includes('http')) { const url = new URL(id); id = url.searchParams.get('id') || id; } } catch { /* ignore */ }
    try {
      await meetingsApi.get(id);
      toast.success('Joining meeting...');
      navigate(`/meeting?id=${id}`);
    } catch {
      toast.error('Meeting not found. Please check the code.');
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    const prevUpcoming = upcomingMeetings;
    const prevPast = pastMeetings;
    setUpcomingMeetings(prev => prev.filter(m => m.id !== meetingId));
    setPastMeetings(prev => prev.filter(m => m.id !== meetingId));
    toast.success('Meeting deleted');
    try {
      await meetingsApi.cancel(meetingId);
    } catch {
      toast.error('Failed to delete meeting');
      setUpcomingMeetings(prevUpcoming);
      setPastMeetings(prevPast);
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    navigate('/');
  };

  // ── derived ───────────────────────────────────────────────────────
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const totalMeetings = upcomingMeetings.length + pastMeetings.length;
  const recentMeetings = pastMeetings.slice(0, 3);

  /* ── Meeting card sub-component ──────────────────────────────── */
  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const isUpcoming = upcomingMeetings.includes(meeting);
    const status = meetingStatus(meeting);

    return (
      <div className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] hover:border-white/15 transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-white truncate">{meeting.title}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#86868b]">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                {new Date(meeting.scheduledStartAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                {' '}at{' '}
                {new Date(meeting.scheduledStartAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isUpcoming && (
              <button
                onClick={() => navigate(`/meeting?id=${meeting.id}`)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
              >
                Join
              </button>
            )}
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4 text-white/50" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[150px]">
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/meeting?id=${meeting.id}`); toast.success('Link copied'); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> Copy link
                    </button>
                    <button
                      onClick={() => { handleDeleteMeeting(meeting.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <div className="h-[100dvh] w-full bg-gradient-to-br from-slate-900 via-[#050507] to-slate-900 text-white font-sans flex flex-col overflow-hidden selection:bg-white/30">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Sidebar */}
      <aside ref={sidebarRef} className="w-64 m-4 rounded-[2rem] bg-white/[0.02] backdrop-blur-3xl border border-white/10 flex flex-col shadow-2xl shrink-0">
        <div className="p-6 flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-[#00FFFF]" />
          <span className="font-semibold text-lg tracking-tight">Samjho AI</span>
        </div>

        {/* User avatar */}
        {user && (
          <div className="px-6 pb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
              <AvatarIcon avatarId={user.avatarId} name={user.name} size={36} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-[11px] text-white/40 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 py-2 space-y-1.5">
          {([
            { view: 'meetings' as const, icon: Video, label: 'Meetings' },
            { view: 'calendar' as const, icon: Calendar, label: 'Calendar' },
            { view: 'settings' as const, icon: Settings, label: 'Settings' },
          ]).map(({ view, icon: Icon, label }) => (
            <motion.button
              key={view}
              onClick={() => switchView(view)}
              layout
              className={`relative z-10 w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors duration-200 ${activeView === view ? 'text-white' : 'text-white/60 hover:text-white'}`}
            >
              {activeView === view && (
                <motion.div
                  layoutId="activePill"
                  className="absolute inset-0 bg-white/10 rounded-xl shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{label}</span>
            </motion.button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col my-4 mr-4 overflow-hidden relative">
        {/* Header */}
        <header ref={headerRef} className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6 shrink-0 pt-4 px-2">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-1">
                  {activeView === 'meetings' && `Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
                  {activeView === 'calendar' && 'Your Calendar'}
                  {activeView === 'settings' && 'Settings'}
                </h1>
                <p className="text-[#86868b] text-lg">
                  {activeView === 'meetings' && 'Ready for your next conversation?'}
                  {activeView === 'calendar' && 'Manage your schedule'}
                  {activeView === 'settings' && 'Manage your preferences'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats pills */}
            {activeView === 'meetings' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden md:flex items-center gap-2"
              >
                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70">
                  <span className="text-white font-semibold mx-1">{totalMeetings}</span> meetings
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70">
                  <span className="text-white font-semibold mx-1">{upcomingMeetings.length}</span> upcoming
                </div>
              </motion.div>
            )}

            <div className="flex items-center gap-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl shadow-xl">
              <Clock className="w-4 h-4 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-lg font-medium tracking-tight tabular-nums">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[11px] text-[#86868b]">
                  {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-6 custom-scrollbar px-2">
          {/* ── Email Verification Banner ── */}
          <AnimatePresence>
            {!emailBannerDismissed && user && !user.emailVerified && (
              <motion.div
                key="email-banner"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 shrink-0"
              >
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-sm text-amber-300 flex-1">Please verify your email address to secure your account.</span>
                <button
                  onClick={async () => {
                    try { await authApi.sendVerification(); toast.success('Verification email sent'); }
                    catch { toast.error('Failed to send verification email'); }
                  }}
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium whitespace-nowrap"
                >
                  Resend email
                </button>
                <button
                  onClick={() => setEmailBannerDismissed(true)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Dismiss email verification banner"
                >
                  <X className="w-4 h-4 text-white/40 hover:text-white/70" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ────────── MEETINGS VIEW ────────── */}
          {/* ────────── MEETINGS VIEW ────────── */}
          <AnimatePresence mode="wait">
            {activeView === 'meetings' && (
              <motion.div
                key="meetings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                {/* Quick actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                  <HoverCard
                    onClick={handleNewMeeting}
                    className="bg-gradient-to-br from-white to-gray-200 text-black p-6 rounded-[2rem] flex flex-col items-start gap-4 text-left cursor-pointer shadow-xl"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center">
                      <Video className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-0.5">New Meeting</h3>
                      <p className="text-black/60 text-sm font-medium">Start instantly</p>
                    </div>
                  </HoverCard>

                  <HoverCard
                    onClick={handleCreateLink}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex flex-col items-start gap-4 text-left cursor-pointer shadow-xl hover:border-white/20"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <LinkIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-0.5 text-white">Create Link</h3>
                      <p className="text-[#86868b] text-sm">Share for later</p>
                    </div>
                  </HoverCard>

                  <HoverCard
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex flex-col items-start gap-4 text-left cursor-pointer shadow-xl hover:border-white/20"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-0.5 text-white">Schedule</h3>
                      <p className="text-[#86868b] text-sm">Plan ahead</p>
                    </div>
                  </HoverCard>
                </div>

                {/* Join + Upcoming */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                  {/* Join */}
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex flex-col justify-center shadow-xl shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Keyboard className="w-5 h-5 text-white/70" />
                      </div>
                      <h3 className="text-lg font-semibold">Join a Meeting</h3>
                    </div>
                    <form onSubmit={handleJoinMeeting} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Enter a code or link"
                        value={meetingCode}
                        onChange={(e) => setMeetingCode(e.target.value)}
                        className="flex-1 bg-black/30 border border-white/15 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-white/30"
                      />
                      <button
                        type="submit"
                        disabled={!meetingCode.trim()}
                        className="px-8 py-3 bg-white text-black font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 active:scale-[0.98] transition-all whitespace-nowrap"
                      >
                        Join
                      </button>
                    </form>
                  </div>

                  {/* Upcoming */}
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col shadow-xl h-full min-h-[300px]">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" /> Upcoming
                      </h3>
                      <button
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                      {meetingsLoading ? (
                        <div className="h-full flex flex-col items-center justify-center py-8">
                          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                      ) : upcomingMeetings.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8">
                          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-white/20" />
                          </div>
                          <div>
                            <p className="text-white/70 font-medium">No upcoming meetings</p>
                            <button
                              onClick={() => setIsScheduleModalOpen(true)}
                              className="text-blue-400 text-sm hover:text-blue-300 mt-1 transition-colors"
                            >
                              Schedule one now →
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {upcomingMeetings.map(meeting => (
                            <MeetingCard key={meeting.id} meeting={meeting} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent (past meetings) */}
                {recentMeetings.length > 0 && (
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <History className="w-4 h-4 text-[#86868b]" /> Recent
                      </h3>
                      {pastMeetings.length > 3 && (
                        <span className="text-xs text-[#86868b]">+{pastMeetings.length - 3} more</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {recentMeetings.map(meeting => (
                        <HoverCard
                          key={meeting.id}
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/meeting?id=${meeting.id}`);
                            toast.success('Meeting link copied');
                          }}
                          className="p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-white/20"
                        >
                          <h4 className="text-sm font-medium text-white/90 truncate mb-1">{meeting.title}</h4>
                          <p className="text-[11px] text-[#86868b]">
                            {new Date(meeting.scheduledStartAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-blue-400/60 text-[11px]">
                            <Copy className="w-3 h-3" /> Copy link
                          </div>
                        </HoverCard>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ────────── CALENDAR VIEW ────────── */}
            {activeView === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-xl h-full flex flex-col"
              >
                {/* Month nav */}
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <h2 className="text-2xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigateMonth(-1)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => { setCurrentMonth(new Date()); }}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all font-medium text-sm"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => navigateMonth(1)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Grid */}
                <CalendarGrid
                  ref={calendarRef}
                  currentMonth={currentMonth}
                  upcomingMeetings={upcomingMeetings}
                  pastMeetings={pastMeetings}
                  onDayClick={(dateStr) => { setScheduleDate(dateStr); setIsScheduleModalOpen(true); }}
                  onJoin={(id) => navigate(`/meeting?id=${id}`)}
                />
              </motion.div>
            )}

            {/* ────────── SETTINGS VIEW ────────── */}
            {activeView === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Profile */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-xl">
                  <div className="flex items-center gap-6 mb-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden shrink-0">
                      {user?.avatarId !== undefined && user?.avatarId !== null ? (
                        <AvatarIcon avatarId={user.avatarId} name={user.name} size={80} />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-2xl font-bold text-white">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-semibold">{user?.name}</h3>
                      <p className="text-[#86868b] mt-1 truncate">{user?.email}</p>
                      <button
                        onClick={() => setAvatarPickerOpen(!avatarPickerOpen)}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium mt-1"
                      >
                        {avatarPickerOpen ? 'Cancel' : 'Change avatar'}
                      </button>
                    </div>
                  </div>

                  {avatarPickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 pt-6 border-t border-white/10"
                    >
                      <p className="text-sm text-[#86868b] mb-4">Pick an avatar for your profile</p>
                      <AvatarPicker
                        currentId={user?.avatarId ?? 0}
                        onSelect={async (id) => {
                          try {
                            setAvatarSaving(true);
                            const updated = await authApi.updateProfile({ avatarId: id });
                            auth.setUser(updated);
                            setUser(updated);
                            toast.success('Avatar updated!');
                          } catch {
                            toast.error('Failed to update avatar');
                          } finally {
                            setAvatarSaving(false);
                          }
                        }}
                      />
                      {avatarSaving && <p className="text-sm text-white/50 mt-2">Saving...</p>}
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-8 mt-6">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="text-3xl font-bold text-white">{totalMeetings}</div>
                      <div className="text-sm text-[#86868b] mt-1">Total Meetings</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="text-3xl font-bold text-white">{upcomingMeetings.length}</div>
                      <div className="text-sm text-[#86868b] mt-1">Upcoming</div>
                    </div>
                  </div>
                </div>

                {/* Devices */}
                <DeviceSettingsPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ────────── MODALS ────────── */}
      <AnimatePresence>
        {isLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setIsLinkModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-[#0f172a] border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Here's your joining info</h2>
                <button onClick={() => setIsLinkModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[#86868b] mb-6">Send this to people you want to meet with. Be sure to save it so you can use it later, too.</p>
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-3 rounded-xl mb-8">
                <span className="flex-1 text-white/90 truncate select-all px-2">{generatedLink}</span>
                <button onClick={handleCopyLink} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center">
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white" />}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={closeScheduleModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-[#0f172a] border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">{scheduleSuccess ? 'Meeting Scheduled' : 'Schedule a meeting'}</h2>
                <button onClick={closeScheduleModal} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {scheduleSuccess ? (
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                    <h3 className="font-medium text-white mb-1 text-lg">{scheduleTitle}</h3>
                    <p className="text-sm text-[#86868b]">
                      {new Date(scheduleDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at {scheduleTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#86868b] mb-3">Share this link with participants:</p>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-3 rounded-xl">
                      <span className="flex-1 text-white/90 truncate select-all text-sm px-2">{scheduledLink}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(scheduledLink); toast.success('Link copied'); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                  </div>
                  <button onClick={closeScheduleModal} className="w-full py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors mt-4">Done</button>
                </div>
              ) : (
                <form onSubmit={handleScheduleMeeting} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[#86868b] mb-2">Meeting Title</label>
                    <input type="text" required value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400/50 transition-colors" placeholder="e.g. Weekly Sync" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#86868b] mb-2">Date</label>
                      <input type="date" required value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400/50 transition-colors [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#86868b] mb-2">Time</label>
                      <input type="time" required value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400/50 transition-colors [color-scheme:dark]" />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={closeScheduleModal} className="px-6 py-3 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors">Schedule</button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── device settings panel (in-meeting or dashboard) ──────────────────── */
function DeviceSettingsPanel() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const devices = useMediaDevices();

  const requestPermission = useCallback(async () => {
    setPermissionLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((t) => t.stop()); // release immediately — we only need the permission
    } catch {
      // Camera denied or unavailable — try audio only
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        // Completely denied, still show empty list
      }
    } finally {
      setPermissionGranted(true);
      setPermissionLoading(false);
    }
  }, []);

  if (permissionLoading) {
    return (
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-xl flex items-center justify-center min-h-[200px]">
        <p className="text-[#86868b] text-sm">Detecting devices…</p>
      </div>
    );
  }

  if (!permissionGranted) {
    return (
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-5 h-5 text-[#86868b]" />
          <h3 className="text-xl font-semibold">Audio &amp; Video Devices</h3>
        </div>
        <div className="text-center py-8">
          <Mic className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-[#86868b] text-sm mb-4">We need permission to display your device list.</p>
          <button
            onClick={requestPermission}
            className="px-6 py-2.5 bg-white text-black rounded-xl font-medium hover:scale-[1.02] active:scale-[0.99] transition-transform"
          >
            Allow Devices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-5 h-5 text-[#86868b]" />
        <h3 className="text-xl font-semibold">Audio &amp; Video Devices</h3>
      </div>

      <div className="space-y-4">
        {/* Microphone */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <Mic className="w-5 h-5 text-white/50 shrink-0" />
            <p className="text-sm font-medium text-white/70">Microphone</p>
          </div>
          {devices.audioDevices.length > 0 ? (
            <select
              className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20"
              value={devices.selectedAudioId}
              onChange={(e) => devices.setSelectedAudioId(e.target.value)}
              aria-label="Select microphone"
            >
              {devices.audioDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-white/30">No microphone detected</p>
          )}
        </div>

        {/* Camera */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <Video className="w-5 h-5 text-white/50 shrink-0" />
            <p className="text-sm font-medium text-white/70">Camera</p>
          </div>
          {devices.videoDevices.length > 0 ? (
            <select
              className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20"
              value={devices.selectedVideoId}
              onChange={(e) => devices.setSelectedVideoId(e.target.value)}
              aria-label="Select camera"
            >
              {devices.videoDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-white/30">No camera detected</p>
          )}
        </div>
      </div>
    </div>
  );
}
