import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare,
  Users, Settings, Sparkles, X, Info,
  MonitorUp, Hand, LayoutGrid, Maximize, FileText,
  CheckCircle2, AlertCircle, Shield, User, Send as SendIcon
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { auth, meetingsApi } from '../lib/api';

// --- Types ---
type SidebarTab = 'chat' | 'participants' | 'transcript' | null;

interface MeetingParticipant {
  id: string;
  name: string;
  role: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
  avatarUrl?: string;
  initials: string;
  stream?: MediaStream;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

// --- Components ---

function HandTrackingIndicator({ isTracking }: { isTracking: boolean }) {
  return (
    <div className={cn(
      "absolute top-3 right-3 px-2.5 py-1.5 rounded-md backdrop-blur-md border text-xs font-medium flex items-center gap-1.5 transition-colors",
      isTracking
        ? "bg-[#00FFFF]/10 border-[#00FFFF]/30 text-[#00FFFF]"
        : "bg-red-500/10 border-red-500/30 text-red-400"
    )}>
      {isTracking ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
      {isTracking ? "Hands in frame" : "Hands not visible"}
    </div>
  );
}

function CaptionsOverlay({ isActive, text }: { isActive: boolean, text: string }) {
  if (!isActive || !text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20 pointer-events-none"
    >
      <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-xl text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] font-medium text-blue-400 uppercase tracking-wider">AI Translation</span>
        </div>
        <p className="text-lg sm:text-xl font-medium text-white leading-tight drop-shadow-md">
          {text}
        </p>
      </div>
    </motion.div>
  );
}

export default function MeetingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const meetingId = searchParams.get('id') || 'default-room';

  // Route guard
  useEffect(() => {
    if (!auth.isLoggedIn()) {
      navigate('/auth', { state: { from: location } });
    }
  }, [navigate, location]);

  // Pre-join state
  const [hasJoined, setHasJoined] = useState(false);
  const [userName, setUserName] = useState(() => auth.getUser()?.name ?? '');

  // Local State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isAiActive, setIsAiActive] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>(null);
  const [currentCaption, setCurrentCaption] = useState("We are currently testing the real-time translation capabilities.");
  const [handsInFrame, setHandsInFrame] = useState(true);
  const [layout, setLayout] = useState<'speaker' | 'grid'>('speaker');
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Real-time state
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const [remoteStreamsVersion, setRemoteStreamsVersion] = useState(0); // Force re-render when streams change

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Exit states
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);

  // Meeting Info state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const meetingLink = window.location.href;
  const meetingTitleRef = useRef('Meeting');

  // Timer
  useEffect(() => {
    if (!hasJoined) return;
    const interval = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasJoined]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Load meeting info
  useEffect(() => {
    meetingsApi.get(meetingId).then((meeting) => {
      meetingTitleRef.current = meeting.title;
    }).catch(() => {});
  }, [meetingId]);

  // Load chat history
  useEffect(() => {
    if (!hasJoined) return;
    meetingsApi.messages(meetingId).then((msgs) => {
      setChatMessages(msgs.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderName,
        text: m.text,
        timestamp: new Date(m.createdAt).toISOString(),
      })));
    }).catch(() => {});
  }, [meetingId, hasJoined]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Local Video Stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (!isVideoOff) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: !isMuted })
        .then((s) => {
          stream = s;
          localStreamRef.current = s;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = s;
          }
        })
        .catch((err) => console.error("Camera error", err));
    }

    return () => {
      if (stream) {
        // Don't stop tracks here if we're in a meeting — other peers need them
        if (!hasJoined) stream?.getTracks().forEach(t => t.stop());
      }
    };
  }, [isVideoOff]);

  // Simulate hand tracking status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setHandsInFrame(Math.random() > 0.2);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // WebRTC helper
  const createPeerConnection = useCallback((peerId: string, initiator: boolean, socket: Socket) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        if (track.readyState === 'live') {
          pc.addTrack(track, localStreamRef.current!);
        }
      });
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      remoteStreamsRef.current.set(peerId, stream);
      setRemoteStreamsVersion((v) => v + 1); // Trigger re-render
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          to: peerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        pc.close();
        peerConnectionsRef.current.delete(peerId);
        remoteStreamsRef.current.delete(peerId);
        setParticipants((prev) => prev.filter((p) => p.id !== peerId));
        setRemoteStreamsVersion((v) => v + 1);
      }
    };

    peerConnectionsRef.current.set(peerId, pc);

    // Initiator creates the offer
    if (initiator) {
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        socket.emit('offer', { to: peerId, offer });
      }).catch(console.error);
    }

    return pc;
  }, []);

  // Socket.io + WebRTC connection
  useEffect(() => {
    if (!hasJoined) return;

    const token = auth.getAccessToken();
    const socket = io(window.location.origin, {
      auth: { accessToken: token },
    });
    socketRef.current = socket;

    // Pending ICE candidates cache
    const pendingCandidates = new Map<string, RTCIceCandidateInit[]>();

    socket.on('connect', () => {
      socket.emit('join-room', meetingId, {
        name: userName || 'Guest User',
        role: 'Guest',
        isMuted,
        isVideoOff,
        isSpeaking: false,
        isHandRaised,
        initials: (userName || 'GU').substring(0, 2).toUpperCase()
      });
    });

    socket.on('existing-participants', (existingParticipants: MeetingParticipant[]) => {
      // Create peer connections for existing users
      for (const p of existingParticipants) {
        if (p.id !== socket.id) {
          createPeerConnection(p.id, true, socket);
          const participant: MeetingParticipant = {
            ...p,
            stream: remoteStreamsRef.current.get(p.id) || undefined,
          };
          setParticipants((prev) => {
            if (prev.find((x) => x.id === p.id)) return prev;
            return [...prev, participant];
          });
        }
      }
    });

    socket.on('user-connected', (user: MeetingParticipant) => {
      if (user.id === socket.id) return;
      setParticipants((prev) => {
        if (prev.find((p) => p.id === user.id)) return prev;
        return [...prev, { ...user, stream: remoteStreamsRef.current.get(user.id) || undefined }];
      });
      // Create peer connection (we respond to their offer)
      createPeerConnection(user.id, false, socket);
    });

    socket.on('user-disconnected', (userId: string) => {
      const pc = peerConnectionsRef.current.get(userId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(userId);
      }
      remoteStreamsRef.current.delete(userId);
      setParticipants((prev) => prev.filter((p) => p.id !== userId));
      setRemoteStreamsVersion((v) => v + 1);
    });

    socket.on('user-state-changed', (userState: Partial<MeetingParticipant> & { id: string }) => {
      setParticipants((prev) => prev.map((p) => p.id === userState.id ? { ...p, ...userState } : p));
    });

    // WebRTC signaling
    socket.on('offer', async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      let pc = peerConnectionsRef.current.get(from);
      if (!pc) {
        pc = createPeerConnection(from, false, socket);
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { to: from, answer });

        // Add any pending ICE candidates
        const pending = pendingCandidates.get(from) || [];
        for (const candidate of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidates.delete(from);
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    socket.on('answer', async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionsRef.current.get(from);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          const pending = pendingCandidates.get(from) || [];
          for (const candidate of pending) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidates.delete(from);
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    });

    socket.on('ice-candidate', async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionsRef.current.get(from);
      if (pc?.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      } else {
        const pending = pendingCandidates.get(from) || [];
        pending.push(candidate);
        pendingCandidates.set(from, pending);
      }
    });

    // Chat messages from socket
    socket.on('chat-message', (message: ChatMessage) => {
      setChatMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      remoteStreamsRef.current.clear();
      socket.disconnect();
    };
  }, [meetingId, hasJoined, createPeerConnection]);

  // Sync local state changes via socket
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.emit('state-change', meetingId, { isMuted, isVideoOff, isHandRaised });
    }
  }, [isMuted, isVideoOff, isHandRaised, meetingId]);

  // Handle mute/unmute — toggle audio track
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    } else {
      setIsMuted((prev) => !prev);
    }
  }, []);

  // Handle video on/off during meeting
  const toggleVideo = useCallback(async () => {
    if (localStreamRef.current && !isVideoOff) {
      // Turn off: stop video track
      localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      setIsVideoOff(true);
    } else if (!localStreamRef.current || isVideoOff) {
      // Turn on: get new video stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        if (localStreamRef.current) {
          // Add track to existing stream
          localStreamRef.current.addTrack(videoTrack);
        } else {
          localStreamRef.current = stream;
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        setIsVideoOff(false);

        // Update RTCPeerConnection senders
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          } else {
            pc.addTrack(videoTrack, localStreamRef.current!);
          }
        });
      } catch (err) {
        console.error('Failed to turn on video:', err);
      }
    }
  }, [isVideoOff]);

  // Send chat message
  const sendChatMessage = useCallback(() => {
    if (!chatInput.trim() || !socketRef.current) return;
    const name = userName || 'Guest User';
    socketRef.current.emit('chat-message', meetingId, { text: chatInput.trim(), senderName: name });
    setChatInput('');
  }, [chatInput, meetingId, userName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (meetingEnded) {
    return (
      <div className="h-screen w-full bg-[#050507] text-white flex flex-col items-center justify-center font-sans selection:bg-[#00FFFF]/30 p-6">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#00FFFF]" />
          </div>
          <h1 className="text-3xl font-semibold mb-2">You left the meeting</h1>
          <p className="text-[#86868b] mb-8">The meeting lasted {formatTime(elapsedSeconds)}. The transcript and AI summary will be available in your dashboard shortly.</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setMeetingEnded(false);
                setHasJoined(false);
              }}
              className="w-full py-3 rounded-xl font-medium bg-white/10 hover:bg-white/20 transition-colors"
            >
              Rejoin
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 rounded-xl font-medium bg-[#00FFFF] text-black hover:bg-[#00FFFF]/90 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-[#050507] to-slate-900 text-white flex items-center justify-center p-4 md:p-8 font-sans selection:bg-white/30">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">

          {/* Video Grid Area */}
          <div className="lg:col-span-3 aspect-video bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl">
            {isVideoOff ? (
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                <User className="w-10 h-10 text-white/40" />
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            )}

            {/* Preview Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
                  isMuted ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
                  isVideoOff ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Right: Join Controls */}
          <div className="lg:col-span-2 flex flex-col gap-6 bg-white/[0.02] backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 shadow-2xl">
            <div>
              <h1 className="text-3xl font-semibold mb-2">Ready to join?</h1>
              <p className="text-[#86868b]">Meeting ID: <span className="font-mono text-white/80">{meetingId}</span></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#86868b] mb-2">Your Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-black/20 border border-white/10 focus:border-blue-400/50 rounded-xl px-4 py-3 text-white outline-none transition-colors placeholder:text-white/30"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userName.trim()) {
                      setHasJoined(true);
                    }
                  }}
                />
              </div>

              <button
                onClick={() => setHasJoined(true)}
                disabled={!userName.trim()}
                className="w-full py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                Join Now
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3.5 bg-transparent text-white/70 font-medium rounded-xl hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Build display participant list (self + remote)
  const displayParticipants = participants.map((p) => ({
    ...p,
    stream: remoteStreamsRef.current.get(p.id),
  }));

  return (
    <div className="h-screen w-full bg-[#050507] text-white overflow-hidden flex flex-col font-sans selection:bg-[#00FFFF]/30">

      {/* Top Bar */}
      <header className="h-14 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-sm font-mono">{formatTime(elapsedSeconds)}</span>
          <span className="text-white/80 text-sm font-medium truncate max-w-xs">{meetingTitleRef.current}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLayout(layout === 'speaker' ? 'grid' : 'speaker')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              layout === 'grid' ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Video Grid Area */}
        <main className={cn(
          "flex-1 p-4 transition-all duration-300 ease-in-out relative",
          activeTab ? "mr-80" : "mr-0",
          layout === 'grid' ? "grid gap-4 auto-rows-fr" : "flex flex-col gap-4"
        )}
        style={{
          gridTemplateColumns: layout === 'grid'
            ? `repeat(${Math.ceil(Math.sqrt(displayParticipants.length + 1))}, minmax(0, 1fr))`
            : undefined
        }}>

          {layout === 'speaker' ? (
            <>
              {/* Active Speaker (Large) */}
              <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#111111] border border-white/10 shadow-2xl">
                {displayParticipants.length > 0 ? (
                  displayParticipants[0].stream ? (
                    <video
                      ref={(el) => {
                        if (el && displayParticipants[0].stream) {
                          el.srcObject = displayParticipants[0].stream;
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : displayParticipants[0].isVideoOff ? (
                    <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                      <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center text-4xl font-medium text-white/60">
                        {displayParticipants[0].initials}
                      </div>
                    </div>
                  ) : (
                    <img
                      src={displayParticipants[0].avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${displayParticipants[0].name}`}
                      alt={displayParticipants[0].name}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                    <div className="text-center">
                      <Shield className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <span className="text-white/40 block">Waiting for others to join...</span>
                      <span className="text-white/20 text-sm mt-1 block">Share your meeting link to invite people</span>
                    </div>
                  </div>
                )}

                {/* Speaker Info */}
                {displayParticipants.length > 0 && (
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", displayParticipants[0].isSpeaking ? "bg-green-500 animate-pulse" : "bg-gray-500")} />
                    <span className="text-sm font-medium">{displayParticipants[0].name}</span>
                    {displayParticipants[0].isMuted && <MicOff className="w-3 h-3 text-red-400 ml-1" />}
                  </div>
                )}

                {/* AI Captions */}
                <CaptionsOverlay isActive={isAiActive} text={currentCaption} />
              </div>

              {/* Bottom Strip (Other Participants + Self View) */}
              <div className="h-40 shrink-0 flex gap-4 overflow-x-auto">
                {/* Self View */}
                <div className="w-64 min-w-[16rem] relative rounded-xl overflow-hidden bg-[#111111] border-2 border-blue-500/30 shadow-lg">
                  {isVideoOff ? (
                    <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-xl font-bold">
                        {(userName || 'GU').substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                      <HandTrackingIndicator isTracking={handsInFrame} />
                    </>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5">
                    {isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-white" />}
                    You
                  </div>
                  {isHandRaised && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white p-1.5 rounded-md shadow-lg">
                      <Hand className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Other Participants */}
                {displayParticipants.slice(1).map((p) => (
                  <ParticipantTile key={p.id} participant={p} />
                ))}
              </div>
            </>
          ) : (
            /* Grid Layout */
            <>
              {/* Self View in Grid */}
              <div className="relative rounded-2xl overflow-hidden bg-[#111111] border border-white/10 shadow-lg">
                {isVideoOff ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-2xl font-bold">
                      {(userName || 'GU').substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    <HandTrackingIndicator isTracking={handsInFrame} />
                  </>
                )}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                  {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-white" />}
                  You
                </div>
                {isHandRaised && (
                  <div className="absolute top-3 left-3 bg-blue-500 text-white p-2 rounded-lg shadow-lg">
                    <Hand className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Other Participants in Grid */}
              {displayParticipants.map((p) => (
                <ParticipantTile key={p.id} participant={p} keyProp={p.id} />
              ))}

              {/* AI Captions in Grid Mode (Floating at bottom) */}
              <CaptionsOverlay isActive={isAiActive} text={currentCaption} />
            </>
          )}

        </main>

        {/* Sidebar */}
        <AnimatePresence>
          {activeTab && (
            <motion.aside
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-[#0a0a0a] border-l border-white/10 flex flex-col z-20"
            >
              <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
                <h2 className="font-semibold capitalize">{activeTab}</h2>
                <button
                  onClick={() => setActiveTab(null)}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'participants' && (
                  <div className="space-y-4">
                    {/* Local User */}
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium overflow-hidden">
                          You
                        </div>
                        <div>
                          <div className="text-sm font-medium">You</div>
                          <div className="text-xs text-white/40">Guest</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-white/40">
                        {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
                        {isVideoOff ? <VideoOff className="w-4 h-4 text-red-400" /> : <Video className="w-4 h-4" />}
                      </div>
                    </div>
                    {/* Remote Users */}
                    {displayParticipants.map(p => (
                      <div key={p.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium overflow-hidden">
                            {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" alt={p.name} /> : p.initials}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{p.name}</div>
                            <div className="text-xs text-white/40">{p.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-white/40">
                          {p.isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
                          {p.isVideoOff ? <VideoOff className="w-4 h-4 text-red-400" /> : <Video className="w-4 h-4" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="h-full flex flex-col">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-3 pb-3">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-2">
                          <MessageSquare className="w-8 h-8" />
                          <p className="text-sm">No messages yet</p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <div key={msg.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={cn(
                                "text-xs font-medium",
                                msg.senderId === socketRef.current?.id ? "text-green-400" : "text-blue-400"
                              )}>
                                {msg.senderName}
                              </span>
                              <span className="text-[10px] text-white/30">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm text-white/80 leading-relaxed">{msg.text}</p>
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    {/* Input */}
                    <div className="pt-3 border-t border-white/10 flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-black/20 border border-white/10 focus:border-blue-400/50 rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendChatMessage();
                          }
                        }}
                      />
                      <button
                        onClick={sendChatMessage}
                        disabled={!chatInput.trim()}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <SendIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'transcript' && (
                  <div className="space-y-6">
                    {chatMessages.filter(m => m.text).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-2 py-8">
                        <FileText className="w-8 h-8" />
                        <p className="text-sm">No transcript yet</p>
                      </div>
                    ) : (
                      chatMessages.map(msg => (
                        <div key={msg.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-400">{msg.senderName}</span>
                            <span className="text-xs text-white/40">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed">{msg.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

      </div>

      {/* Bottom Control Bar */}
      <footer className="h-20 bg-black/40 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-6 shrink-0 z-30">

        {/* Left: Settings/Info */}
        <div className="w-1/3 flex items-center gap-2">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Primary Controls */}
        <div className="flex items-center justify-center gap-3 w-1/3">
          <button
            onClick={toggleMute}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
              isMuted ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
              isVideoOff ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button
            onClick={async () => {
              try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                // Replace video track in all peer connections
                peerConnectionsRef.current.forEach((pc) => {
                  const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
                  if (sender) {
                    sender.replaceTrack(stream.getVideoTracks()[0]);
                  }
                });
                stream.getVideoTracks()[0].onended = () => {
                  // Stop sharing: restore camera track
                  if (localStreamRef.current) {
                    const camVideo = localStreamRef.current.getVideoTracks()[0];
                    if (camVideo) {
                      peerConnectionsRef.current.forEach((pc) => {
                        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
                        if (sender) sender.replaceTrack(camVideo);
                      });
                    }
                  }
                };
              } catch (err) {
                console.error('Screen share error:', err);
              }
            }}
            className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <MonitorUp className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
              isHandRaised ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            <Hand className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="w-16 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors ml-2"
            title="Leave Meeting"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* Right: AI Toggle & Sidebar Controls */}
        <div className="w-1/3 flex items-center justify-end gap-3">
          {/* AI Translation Toggle */}
          <button
            onClick={() => setIsAiActive(!isAiActive)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 border",
              isAiActive
                ? "bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            <Sparkles className="w-4 h-4" />
            {isAiActive ? "AI Active" : "AI Off"}
          </button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Sidebar Toggles */}
          <button
            onClick={() => setActiveTab(activeTab === 'participants' ? null : 'participants')}
            className={cn(
              "p-2.5 rounded-xl transition-colors",
              activeTab === 'participants' ? "bg-blue-500/20 text-blue-400" : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'chat' ? null : 'chat')}
            className={cn(
              "p-2.5 rounded-xl transition-colors",
              activeTab === 'chat' ? "bg-blue-500/20 text-blue-400" : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'transcript' ? null : 'transcript')}
            className={cn(
              "p-2.5 rounded-xl transition-colors",
              activeTab === 'transcript' ? "bg-blue-500/20 text-blue-400" : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>

      </footer>

      {/* Meeting Info Modal */}
      <AnimatePresence>
        {isInfoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Your meeting's ready</h2>
                <button
                  onClick={() => setIsInfoModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[#86868b] mb-4">Share this meeting link with others you want in the meeting.</p>

              <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-3 rounded-xl mb-6">
                <span className="flex-1 text-white/90 truncate select-all text-sm">{meetingLink}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(meetingLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Info className="w-5 h-5 text-white" />}
                </button>
              </div>

              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leave Meeting Modal */}
      <AnimatePresence>
        {isLeaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-white/10 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl"
            >
              <h2 className="text-xl font-semibold mb-2">Leave meeting?</h2>
              <p className="text-[#86868b] mb-6">Are you sure you want to leave this meeting?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsLeaveModalOpen(false);
                    setMeetingEnded(true);
                    // Cleanup
                    peerConnectionsRef.current.forEach((pc) => pc.close());
                    peerConnectionsRef.current.clear();
                    socketRef.current?.disconnect();
                  }}
                  className="flex-1 py-2.5 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Settings</h2>
                <button
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">Audio</h3>
                  <div className="bg-black/20 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mic className="w-5 h-5 text-white/60" />
                      <span>Microphone</span>
                    </div>
                    <span className="text-sm text-blue-400">Default</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">Video</h3>
                  <div className="bg-black/20 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-white/60" />
                      <span>Camera</span>
                    </div>
                    <span className="text-sm text-blue-400">FaceTime HD</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-full mt-8 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable participant tile for both speaker and grid layouts
function ParticipantTile({ participant, keyProp }: { participant: MeetingParticipant; keyProp?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  return (
    <div key={keyProp || participant.id} className="relative rounded-xl overflow-hidden bg-[#111111] border border-white/10">
      {participant.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : participant.isVideoOff ? (
        <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-medium text-white/60">
            {participant.initials}
          </div>
        </div>
      ) : (
        <img src={participant.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${participant.name}`} alt={participant.name} className="w-full h-full object-cover" />
      )}
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5">
        {participant.isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-white" />}
        {participant.name}
      </div>
    </div>
  );
}
