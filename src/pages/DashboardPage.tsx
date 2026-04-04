import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Calendar, Keyboard, Clock, Settings, LogOut, Link as LinkIcon, Copy, Check, X, Plus, ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [meetingCode, setMeetingCode] = useState('');
  const [activeView, setActiveView] = useState<'meetings' | 'calendar' | 'settings'>('meetings');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Modals state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Schedule form state
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduledLink, setScheduledLink] = useState('');

  // Upcoming meetings state
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const generateId = () => Math.random().toString(36).substring(2, 12);

  const handleNewMeeting = async () => {
    const id = generateId();
    try {
      await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: 'Instant Meeting', date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().substring(0, 5) })
      });
    } catch (e) {
      console.error(e);
    }
    navigate(`/meeting?id=${id}`);
  };

  const handleCreateLink = async () => {
    const id = generateId();
    try {
      await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: 'Generated Link Meeting', date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().substring(0, 5) })
      });
    } catch (e) {
      console.error(e);
    }
    const link = `${window.location.origin}/meeting?id=${id}`;
    setGeneratedLink(link);
    setIsLinkModalOpen(true);
    setCopied(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTitle || !scheduleDate || !scheduleTime) return;

    const newId = generateId();
    const newMeeting: Meeting = {
      id: newId,
      title: scheduleTitle,
      date: scheduleDate,
      time: scheduleTime,
    };

    try {
      await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMeeting)
      });
    } catch (e) {
      console.error(e);
    }

    setUpcomingMeetings(prev => [...prev, newMeeting].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    }));

    setScheduledLink(`${window.location.origin}/meeting?id=${newId}`);
    setScheduleSuccess(true);
  };

  const closeScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setTimeout(() => {
      setScheduleTitle('');
      setScheduleDate('');
      setScheduleTime('');
      setScheduleSuccess(false);
      setScheduledLink('');
      setCopied(false);
    }, 300);
  };

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (meetingCode.trim()) {
      // Extract ID if it's a full URL
      let id = meetingCode.trim();
      try {
        if (id.includes('http')) {
          const url = new URL(id);
          id = url.searchParams.get('id') || id;
        }
      } catch (e) {
        // Ignore invalid URL errors
      }
      
      try {
        const res = await fetch(`/api/meetings/${id}`);
        if (!res.ok) {
          alert("Meeting not found. Please check the code.");
          return;
        }
      } catch (e) {
        console.error(e);
      }
      
      navigate(`/meeting?id=${id}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-[#050507] to-slate-900 text-white font-sans flex overflow-hidden selection:bg-white/30">
      {/* Sidebar - Floating Glass */}
      <aside className="w-64 m-4 rounded-[2rem] bg-white/[0.02] backdrop-blur-3xl border border-white/10 flex flex-col shadow-2xl shrink-0">
        <div className="p-6 flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-[#00FFFF]" />
          <span className="font-semibold text-lg tracking-tight">Samjho AI</span>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2">
          <button 
            onClick={() => setActiveView('meetings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${activeView === 'meetings' ? 'bg-white/10 text-white shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Video className="w-5 h-5" />
            Meetings
          </button>
          <button 
            onClick={() => setActiveView('calendar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${activeView === 'calendar' ? 'bg-white/10 text-white shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Calendar className="w-5 h-5" />
            Calendar
          </button>
          <button 
            onClick={() => setActiveView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${activeView === 'settings' ? 'bg-white/10 text-white shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col my-4 mr-4 overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="flex-1 flex flex-col relative z-10 overflow-hidden max-w-6xl w-full mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 shrink-0 pt-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
                {activeView === 'meetings' && 'Welcome back'}
                {activeView === 'calendar' && 'Your Calendar'}
                {activeView === 'settings' && 'Settings'}
              </h1>
              <p className="text-[#86868b] text-lg">
                {activeView === 'meetings' && 'Ready for your next conversation?'}
                {activeView === 'calendar' && 'Manage your schedule'}
                {activeView === 'settings' && 'Manage your preferences'}
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl shadow-xl">
              <Clock className="w-5 h-5 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-xl font-medium tracking-tight">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-xs text-[#86868b]">
                  {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </header>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-6 custom-scrollbar">
            {activeView === 'meetings' && (
              <div className="flex flex-col gap-6 h-full">
                {/* Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNewMeeting}
                    className="bg-gradient-to-br from-white to-gray-200 text-black p-6 rounded-[2rem] flex flex-col items-start gap-4 text-left group shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Video className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1">New Meeting</h3>
                      <p className="text-black/60 text-sm font-medium">Start instantly</p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateLink}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex flex-col items-start gap-4 text-left group hover:bg-white/[0.05] transition-all duration-300 shadow-xl"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <LinkIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1 text-white">Create Link</h3>
                      <p className="text-[#86868b] text-sm">Share for later</p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex flex-col items-start gap-4 text-left group hover:bg-white/[0.05] transition-all duration-300 shadow-xl"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1 text-white">Schedule</h3>
                      <p className="text-[#86868b] text-sm">Plan ahead</p>
                    </div>
                  </motion.button>
                </div>

                {/* Join & Upcoming Split */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                  {/* Join Input */}
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex flex-col justify-center shadow-xl shrink-0 h-fit">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Keyboard className="w-5 h-5 text-white/70" />
                      </div>
                      <h3 className="text-lg font-semibold">Join a Meeting</h3>
                    </div>
                    <form onSubmit={handleJoinMeeting} className="flex flex-col sm:flex-row gap-4">
                      <input 
                        type="text" 
                        placeholder="Enter a code or link" 
                        value={meetingCode}
                        onChange={(e) => setMeetingCode(e.target.value)}
                        className="flex-1 bg-black/20 border border-white/10 focus:border-blue-400/50 rounded-xl px-4 py-3 text-white outline-none transition-colors placeholder:text-white/30"
                      />
                      <button 
                        type="submit"
                        disabled={!meetingCode.trim()}
                        className="px-8 py-3 bg-white text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors whitespace-nowrap"
                      >
                        Join
                      </button>
                    </form>
                  </div>

                  {/* Upcoming */}
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col shadow-xl h-full min-h-[300px]">
                    <div className="flex items-center justify-between mb-6 shrink-0">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#86868b]" />
                        Upcoming
                      </h3>
                      <button 
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {upcomingMeetings.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8">
                          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-white/20" />
                          </div>
                          <div>
                            <p className="text-white/70 font-medium">No upcoming meetings</p>
                            <p className="text-[#86868b] text-sm mt-1">Your scheduled meetings will appear here</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {upcomingMeetings.map((meeting) => (
                            <div key={meeting.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col gap-2">
                              <h4 className="font-medium text-white">{meeting.title}</h4>
                              <div className="flex items-center justify-between text-sm text-[#86868b]">
                                <span>{new Date(meeting.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {meeting.time}</span>
                                <button 
                                  onClick={() => navigate(`/meeting?id=${meeting.id}`)}
                                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                >
                                  Join
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'calendar' && (
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-xl h-full flex flex-col">
                <div className="flex items-center justify-between mb-8 shrink-0">
                  <h2 className="text-2xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setCurrentMonth(new Date())}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors font-medium text-sm"
                    >
                      Today
                    </button>
                    <button 
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col bg-black/20 rounded-xl overflow-hidden border border-white/10">
                  <div className="grid grid-cols-7 gap-px bg-white/10 shrink-0">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="bg-[#111] p-3 text-center text-sm font-medium text-[#86868b]">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-7 gap-px bg-white/10 overflow-y-auto">
                    {eachDayOfInterval({
                      start: startOfWeek(startOfMonth(currentMonth)),
                      end: endOfWeek(endOfMonth(currentMonth))
                    }).map((day, i) => {
                      const dayMeetings = upcomingMeetings.filter(m => isSameDay(parseISO(m.date), day));
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <div 
                          key={i} 
                          className={`bg-[#0a0a0a] min-h-[100px] p-2 transition-colors hover:bg-white/5 group ${!isCurrentMonth ? 'opacity-40' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-blue-500 text-white' : 'text-white/80'}`}>
                              {format(day, 'd')}
                            </span>
                            {isCurrentMonth && (
                              <button 
                                onClick={() => {
                                  setScheduleDate(format(day, 'yyyy-MM-dd'));
                                  setIsScheduleModalOpen(true);
                                }}
                                className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                            {dayMeetings.map(meeting => (
                              <div 
                                key={meeting.id}
                                onClick={() => navigate(`/meeting?id=${meeting.id}`)}
                                className="text-xs p-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 truncate cursor-pointer hover:bg-blue-500/20 transition-colors"
                                title={`${meeting.time} - ${meeting.title}`}
                              >
                                {meeting.time} {meeting.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'settings' && (
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-xl max-w-2xl">
                <h2 className="text-2xl font-semibold mb-6">Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Audio & Video</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <div>
                          <div className="font-medium">Microphone</div>
                          <div className="text-sm text-[#86868b]">Default - System Audio</div>
                        </div>
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">Test</button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <div>
                          <div className="font-medium">Camera</div>
                          <div className="text-sm text-[#86868b]">FaceTime HD Camera</div>
                        </div>
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">Preview</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f172a] border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Here's your joining info</h2>
                <button 
                  onClick={() => setIsLinkModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[#86868b] mb-6">Send this to people you want to meet with. Be sure to save it so you can use it later, too.</p>
              
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-3 rounded-xl mb-8">
                <span className="flex-1 text-white/90 truncate select-all px-2">{generatedLink}</span>
                <button 
                  onClick={handleCopyLink}
                  className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white" />}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f172a] border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {scheduleSuccess ? 'Meeting Scheduled' : 'Schedule a meeting'}
                </h2>
                <button 
                  onClick={closeScheduleModal}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
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
                        onClick={() => {
                          navigator.clipboard.writeText(scheduledLink);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    onClick={closeScheduleModal}
                    className="w-full py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors mt-4"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleScheduleMeeting} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[#86868b] mb-2">Meeting Title</label>
                    <input 
                      type="text" 
                      required
                      value={scheduleTitle}
                      onChange={(e) => setScheduleTitle(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      placeholder="e.g. Weekly Sync"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#86868b] mb-2">Date</label>
                      <input 
                        type="date" 
                        required
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400/50 transition-colors [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#86868b] mb-2">Time</label>
                      <input 
                        type="time" 
                        required
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400/50 transition-colors [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={closeScheduleModal}
                      className="px-6 py-3 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Schedule
                    </button>
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
