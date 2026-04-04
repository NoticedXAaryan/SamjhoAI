import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { useRef, useState, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Zap, Globe, Lock, Video, PlayCircle, Shield, Download, Mic, MessageSquare, PhoneOff, Cpu, Twitter, Linkedin, Github } from 'lucide-react';

const DynamicIslandNav = memo(() => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const handleStartMeeting = () => {
    if (localStorage.getItem('isAuthenticated') === 'true') {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 flex justify-center w-[calc(100%-2rem)] sm:w-full max-w-[800px] pointer-events-none">
      <motion.nav
        layout
        onHoverStart={() => setIsExpanded(true)}
        onHoverEnd={() => setIsExpanded(false)}
        className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full overflow-hidden flex items-center shadow-[0_0_20px_rgba(0,0,0,0.8)] sm:shadow-[0_0_30px_rgba(0,0,0,0.5)] pointer-events-auto cursor-default max-w-full"
        initial={{ borderRadius: 32 }}
      >
        <div className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 gap-2 sm:gap-4 max-w-full">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00FFFF]" />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-semibold tracking-tight whitespace-nowrap overflow-hidden"
                >
                  Samjho AI
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden md:block">
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-6 px-4 text-sm font-medium text-white/70 whitespace-nowrap overflow-hidden"
                >
                  <a href="#" className="hover:text-white transition-colors">Product</a>
                  <a href="#" className="hover:text-white transition-colors">Technology</a>
                  <a href="#" className="hover:text-white transition-colors">Enterprise</a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/auth')}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden md:block whitespace-nowrap"
            >
              Sign In
            </button>
            <button 
              onClick={handleStartMeeting}
              className="bg-white text-black px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold hover:scale-105 transition-transform whitespace-nowrap"
            >
              Try Now
            </button>
          </div>
        </div>
      </motion.nav>
    </div>
  );
});
DynamicIslandNav.displayName = 'DynamicIslandNav';

const CVBackground = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let particles: any[] = [];
    const spacing = 60; // Increased spacing to reduce particle count
    let isVisible = true;

    let activeConstellations: any[] = [];

    const initGrid = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const cols = Math.ceil(canvas.width / spacing);
      const rows = Math.ceil(canvas.height / spacing);
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          particles.push({
            baseX: i * spacing,
            baseY: j * spacing,
            x: i * spacing,
            y: j * spacing,
            targetX: null,
            targetY: null,
            inConstellation: false
          });
        }
      }
      activeConstellations = [];
    };

    window.addEventListener('resize', initGrid);
    initGrid();

    // Hand sign templates (normalized 0-1)
    const handTemplates = [
      // Open palm
      {
        points: [
          [0.5, 0.9], [0.4, 0.8], [0.3, 0.7], [0.2, 0.6], [0.1, 0.5],
          [0.45, 0.6], [0.4, 0.4], [0.38, 0.2], [0.35, 0.1],
          [0.5, 0.58], [0.5, 0.35], [0.5, 0.15], [0.5, 0.05],
          [0.55, 0.6], [0.6, 0.4], [0.62, 0.2], [0.65, 0.1],
          [0.6, 0.7], [0.7, 0.55], [0.75, 0.4], [0.8, 0.3]
        ],
        connections: [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]]
      },
      // Peace sign
      {
        points: [
          [0.5, 0.9], [0.4, 0.8], [0.3, 0.7], [0.35, 0.6], [0.4, 0.65],
          [0.45, 0.6], [0.4, 0.4], [0.38, 0.2], [0.35, 0.1],
          [0.5, 0.58], [0.5, 0.35], [0.5, 0.15], [0.5, 0.05],
          [0.55, 0.6], [0.6, 0.65], [0.55, 0.7], [0.5, 0.75],
          [0.6, 0.7], [0.65, 0.75], [0.6, 0.8], [0.55, 0.85]
        ],
        connections: [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]]
      },
      // OK sign
      {
        points: [
          [0.5, 0.9], [0.4, 0.8], [0.3, 0.7], [0.35, 0.5], [0.45, 0.45],
          [0.45, 0.6], [0.4, 0.4], [0.45, 0.35], [0.45, 0.45],
          [0.5, 0.58], [0.5, 0.35], [0.5, 0.15], [0.5, 0.05],
          [0.55, 0.6], [0.6, 0.4], [0.62, 0.2], [0.65, 0.1],
          [0.6, 0.7], [0.7, 0.55], [0.75, 0.4], [0.8, 0.3]
        ],
        connections: [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]]
      },
      // I Love You (ASL)
      {
        points: [
          [0.5, 0.9], [0.4, 0.8], [0.3, 0.7], [0.2, 0.6], [0.1, 0.5], // Thumb out
          [0.45, 0.6], [0.4, 0.4], [0.38, 0.2], [0.35, 0.1], // Index up
          [0.5, 0.58], [0.5, 0.65], [0.5, 0.7], [0.5, 0.75], // Middle down
          [0.55, 0.6], [0.55, 0.65], [0.55, 0.7], [0.55, 0.75], // Ring down
          [0.6, 0.7], [0.65, 0.55], [0.7, 0.4], [0.75, 0.3] // Pinky up
        ],
        connections: [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]]
      },
      // Thumbs Up
      {
        points: [
          [0.5, 0.9], [0.4, 0.8], [0.3, 0.6], [0.3, 0.4], [0.3, 0.2], // Thumb up
          [0.45, 0.6], [0.5, 0.55], [0.5, 0.65], [0.45, 0.7], // Index folded
          [0.5, 0.65], [0.55, 0.6], [0.55, 0.7], [0.5, 0.75], // Middle folded
          [0.55, 0.7], [0.6, 0.65], [0.6, 0.75], [0.55, 0.8], // Ring folded
          [0.6, 0.75], [0.65, 0.7], [0.65, 0.8], [0.6, 0.85] // Pinky folded
        ],
        connections: [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]]
      },
      // Pointing Up
      {
        points: [
          [0.5, 0.9], [0.4, 0.8], [0.3, 0.7], [0.4, 0.65], [0.45, 0.6], // Thumb folded
          [0.45, 0.6], [0.45, 0.4], [0.45, 0.2], [0.45, 0.1], // Index up
          [0.5, 0.6], [0.5, 0.7], [0.5, 0.75], [0.5, 0.8], // Middle folded
          [0.55, 0.65], [0.55, 0.75], [0.55, 0.8], [0.55, 0.85], // Ring folded
          [0.6, 0.7], [0.6, 0.8], [0.6, 0.85], [0.6, 0.9] // Pinky folded
        ],
        connections: [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]]
      },
      // Rock On / Horns
      {
        points: [
          [0.5, 0.9], [0.4, 0.8], [0.3, 0.7], [0.4, 0.65], [0.45, 0.6], // Thumb folded
          [0.45, 0.6], [0.4, 0.4], [0.35, 0.2], [0.3, 0.1], // Index up/left
          [0.5, 0.6], [0.5, 0.7], [0.5, 0.75], [0.5, 0.8], // Middle folded
          [0.55, 0.65], [0.55, 0.75], [0.55, 0.8], [0.55, 0.85], // Ring folded
          [0.6, 0.7], [0.65, 0.5], [0.7, 0.3], [0.75, 0.2] // Pinky up/right
        ],
        connections: [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]]
      },
      // ASL Letter 'C'
      {
        points: [
          [0.5, 0.9], [0.4, 0.8], [0.3, 0.7], [0.3, 0.6], [0.35, 0.5], // Thumb curved up
          [0.45, 0.6], [0.4, 0.4], [0.45, 0.3], [0.55, 0.3], // Index curved down
          [0.5, 0.65], [0.45, 0.45], [0.5, 0.35], [0.6, 0.35], // Middle curved down
          [0.55, 0.7], [0.5, 0.5], [0.55, 0.4], [0.65, 0.4], // Ring curved down
          [0.6, 0.75], [0.55, 0.55], [0.6, 0.45], [0.7, 0.45] // Pinky curved down
        ],
        connections: [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]]
      }
    ];

    let time = 0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      if (!isVisible) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.05;

      // Constellation logic
      if (activeConstellations.length < 3 && Math.random() < 0.02) { // More frequent, up to 3 at once
        // 1. Pick a unique template
        const activeTemplateIndices = activeConstellations.map(c => c.templateIndex);
        const availableIndices = handTemplates.map((_, i) => i).filter(i => !activeTemplateIndices.includes(i));
        
        if (availableIndices.length > 0) {
          const templateIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
          const template = handTemplates[templateIndex];
          
          // 2. Find a non-overlapping position on the sides
          let validPosition = false;
          let centerX = 0, centerY = 0;
          let attempts = 0;
          const scale = 120 + Math.random() * 60;
          
          while (!validPosition && attempts < 10) {
            attempts++;
            const isLeft = Math.random() > 0.5;
            const marginX = canvas.width * 0.05;
            const sideWidth = canvas.width * 0.20; // Keep strictly to outer 20%
            
            centerX = isLeft 
              ? marginX + Math.random() * sideWidth 
              : canvas.width - marginX - Math.random() * sideWidth;
              
            centerY = canvas.height * 0.15 + Math.random() * (canvas.height * 0.7);
            
            // Check distance against active constellations
            let tooClose = false;
            for (const active of activeConstellations) {
              const dist = Math.hypot(active.centerX - centerX, active.centerY - centerY);
              if (dist < 350) { // Minimum distance between centers
                tooClose = true;
                break;
              }
            }
            
            if (!tooClose) {
              validPosition = true;
            }
          }
          
          if (validPosition) {
            const selectedParticles: any[] = [];
            const usedIndices = new Set();

            let canForm = true;
            for (let i = 0; i < template.points.length; i++) {
              const tx = centerX + (template.points[i][0] - 0.5) * scale;
              const ty = centerY + (template.points[i][1] - 0.5) * scale;
              
              let closestIdx = -1;
              let minDist = Infinity;
              
              for (let j = 0; j < particles.length; j++) {
                if (usedIndices.has(j) || particles[j].inConstellation) continue;
                const dist = Math.hypot(particles[j].baseX - tx, particles[j].baseY - ty);
                if (dist < minDist) {
                  minDist = dist;
                  closestIdx = j;
                }
              }
              
              if (closestIdx !== -1 && minDist < spacing * 4) { // Make sure it doesn't pull from too far
                usedIndices.add(closestIdx);
                selectedParticles.push(particles[closestIdx]);
                particles[closestIdx].targetX = tx;
                particles[closestIdx].targetY = ty;
                particles[closestIdx].inConstellation = true;
              } else {
                canForm = false;
                break;
              }
            }

            if (canForm && selectedParticles.length === template.points.length) {
              activeConstellations.push({
                particles: selectedParticles,
                connections: template.connections,
                timer: 0,
                maxTime: 240 + Math.random() * 120, // ~4-6 seconds at 60fps
                templateIndex,
                centerX,
                centerY
              });
            } else {
              // Revert if failed
              selectedParticles.forEach(p => {
                p.inConstellation = false;
                p.targetX = null;
                p.targetY = null;
              });
            }
          }
        }
      }

      // Process active constellations
      for (let i = activeConstellations.length - 1; i >= 0; i--) {
        const constellation = activeConstellations[i];
        constellation.timer++;
        
        // Draw constellation lines
        const fade = Math.min(1, constellation.timer / 30, (constellation.maxTime - constellation.timer) / 30);
        ctx.strokeStyle = `rgba(255, 255, 255, ${fade * 0.5})`;
        ctx.lineWidth = 1.5;
        
        constellation.connections.forEach(([a, b]: number[]) => {
          const p1 = constellation.particles[a];
          const p2 = constellation.particles[b];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });

        if (constellation.timer >= constellation.maxTime) {
          constellation.particles.forEach((p: any) => {
            p.inConstellation = false;
            p.targetX = null;
            p.targetY = null;
          });
          activeConstellations.splice(i, 1);
        }
      }

      // Update and draw particles
      particles.forEach(p => {
        if (p.inConstellation && p.targetX !== null && p.targetY !== null) {
          // Move towards target smoothly with slight spring
          p.x += (p.targetX - p.x) * 0.1;
          p.y += (p.targetY - p.y) * 0.1;
        } else {
          // Return to base grid smoothly with subtle breathing
          const breatheX = Math.sin(time + p.baseY * 0.01) * 2;
          const breatheY = Math.cos(time + p.baseX * 0.01) * 2;
          p.x += (p.baseX + breatheX - p.x) * 0.05;
          p.y += (p.baseY + breatheY - p.y) * 0.05;
        }

        // Draw particle
        const baseSize = p.inConstellation ? 2 : 1;
        const breatheSize = p.inConstellation ? 0 : Math.sin(time * 2 + p.baseX * 0.05) * 0.5;
        const size = Math.max(0.1, baseSize + breatheSize);
        
        ctx.fillStyle = p.inConstellation 
          ? 'rgba(255, 255, 255, 0.9)' 
          : 'rgba(255, 255, 255, 0.2)';
        
        if (p.inConstellation) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw glow for constellation stars
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(p.x - size, p.y - size, size * 2, size * 2);
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(canvas);
    
    // Initial render
    render();

    return () => {
      window.removeEventListener('resize', initGrid);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
});
CVBackground.displayName = 'CVBackground';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStartMeeting = () => {
    if (localStorage.getItem('isAuthenticated') === 'true') {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  // Laptop Wrapper
  const wrapperRotateX = useTransform(heroProgress, [0.1, 0.4], [-60, 0]);
  const laptopScale = useTransform(heroProgress, [0.1, 0.4], [0.5, 1]);
  const laptopY = useTransform(heroProgress, [0.1, 0.4], [400, 0]);
  
  // Lid Opening
  const lidRotateX = useTransform(heroProgress, [0.1, 0.4], [-95, 0]);
  
  // Screen Zoom (Subtle)
  const screenScale = useTransform(heroProgress, [0.6, 0.9], [1, 1.02]);
  const screenY = useTransform(heroProgress, [0.6, 0.9], [0, 0]);

  // Fade out
  const heroOpacity = useTransform(heroProgress, [0.8, 1], [1, 0]);
  
  const textOpacity = useTransform(heroProgress, [0, 0.15], [1, 0]);
  const textY = useTransform(heroProgress, [0, 0.15], [0, -50]);

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] font-sans selection:bg-[#00FFFF]/30">
      <DynamicIslandNav />

      {/* Hero Section */}
      <section ref={heroRef} className="relative h-[400vh]">
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden" style={{ perspective: '1200px' }}>
          <CVBackground />
          <motion.div 
            style={{ opacity: textOpacity, y: textY }}
            className="text-center absolute top-[20%] z-10 w-full px-4 pointer-events-none"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tighter mb-4 text-white">Samjho AI</h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium text-[#a1a1a6] tracking-tight">Sign language, translated in real-time.</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pointer-events-auto">
              <button 
                onClick={handleStartMeeting}
                className="bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:scale-105 transition-transform"
              >
                Start Meeting
              </button>
              <button 
                onClick={() => navigate('/download')}
                className="flex items-center gap-2 text-base sm:text-lg font-medium hover:underline group text-white"
              >
                Download App <Download className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Laptop Mockup */}
          <motion.div 
            style={{ 
              rotateX: wrapperRotateX, 
              scale: laptopScale, 
              y: laptopY, 
              opacity: heroOpacity,
              transformStyle: 'preserve-3d',
              willChange: "transform, opacity"
            }}
            className="relative w-[90vw] max-w-[700px] mt-24 flex flex-col items-center z-20"
          >
            {/* Lid */}
            <motion.div 
              style={{ 
                rotateX: lidRotateX, 
                z: 1,
                transformOrigin: 'bottom',
                transformStyle: 'preserve-3d' 
              }}
              className="w-full aspect-[16/10] bg-[#000] rounded-2xl border-[4px] border-[#444] shadow-[0_0_30px_rgba(0,0,0,0.8)] sm:shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-20"
            >
              {/* Back of Lid (Cover) */}
              <div 
                className="absolute inset-[-4px] bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-2xl border border-[#444] flex items-center justify-center backface-hidden"
                style={{ transform: 'translateZ(-1px) rotateY(180deg)', backfaceVisibility: 'hidden' }}
              >
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-white/5 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                  <Sparkles className="w-8 h-8 text-[#00FFFF]" />
                </div>
              </div>

              {/* Front of Lid (Screen) */}
              <div 
                className="absolute inset-0 bg-[#0a0a0a] rounded-xl overflow-hidden backface-hidden mt-1 mx-1 mb-2"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* Camera dot */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#111] border border-[#222] z-30 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 rounded-full bg-blue-500/50" />
                </div>

                <motion.div style={{ scale: screenScale, y: screenY }} className="w-full h-full relative origin-center">
                  {/* Screen Content: Realistic Meeting UI */}
                  <div className="w-full h-full relative font-sans bg-[#0a0a0a]">
                    {/* Main Video (Remote User Signing) */}
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop" alt="Main speaker" className="w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
                    
                    {/* AI Hand Tracking Overlay */}
                    <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] border border-[#00FFFF]/50 rounded-lg bg-[#00FFFF]/10 flex items-start p-2">
                       <div className="bg-[#00FFFF] text-black text-[10px] font-mono px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                         <Sparkles className="w-3 h-3" /> Tracking ASL
                       </div>
                    </div>

                    {/* Top Bar */}
                    <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                      <div className="flex items-center gap-1 sm:gap-2 text-white">
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                        <span className="text-[10px] sm:text-xs font-medium">End-to-End Encrypted</span>
                      </div>
                      <div className="bg-black/50 backdrop-blur-md px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-white text-[10px] sm:text-xs border border-white/10">
                        04:23
                      </div>
                    </div>

                    {/* PIP (Local User) */}
                    <div className="absolute top-10 sm:top-4 right-2 sm:right-4 w-20 sm:w-32 aspect-video bg-gray-800 rounded-lg overflow-hidden border border-white/20 shadow-lg">
                      <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop" alt="Local user" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>

                    {/* Live Captions */}
                    <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 w-[90%] sm:w-[80%] max-w-md">
                      <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-2 sm:p-3 text-center shadow-2xl">
                        <p className="text-white text-xs sm:text-sm font-medium">
                          "It's so great to finally meet you!"
                        </p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 bg-black/80 backdrop-blur-xl border border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer transition-colors"><Mic className="w-3 h-3 sm:w-4 sm:h-4 text-white" /></div>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer transition-colors"><Video className="w-3 h-3 sm:w-4 sm:h-4 text-white" /></div>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer transition-colors"><MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-white" /></div>
                      <div className="w-8 h-6 sm:w-10 sm:h-8 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 cursor-pointer transition-colors"><PhoneOff className="w-3 h-3 sm:w-4 sm:h-4 text-white" /></div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Base */}
            <div 
              className="w-full h-[150px] sm:h-[250px] md:h-[350px] bg-gradient-to-b from-[#333] to-[#111] rounded-b-xl sm:rounded-b-3xl absolute top-full left-0 origin-top z-10 shadow-2xl"
              style={{ transform: 'rotateX(90deg)' }}
            >
               {/* Keyboard Well */}
               <div className="absolute top-2 sm:top-6 left-1/2 -translate-x-1/2 w-[85%] h-[80px] sm:h-[130px] md:h-[180px] bg-[#1a1a1a] rounded-sm sm:rounded-md border-t border-[#0a0a0a] border-b border-[#444] p-0.5 sm:p-1">
                  {/* Fake keys */}
                  <div className="w-full h-full grid grid-cols-12 grid-rows-6 gap-0.5 sm:gap-1">
                    {Array.from({length: 72}).map((_, i) => (
                      <div key={i} className="bg-[#222] rounded-[1px] sm:rounded-sm border-b border-[#111]" />
                    ))}
                  </div>
               </div>
               {/* Trackpad */}
               <div className="absolute bottom-2 sm:bottom-6 left-1/2 -translate-x-1/2 w-[35%] h-[40px] sm:h-[70px] md:h-[110px] bg-[#222] rounded-sm sm:rounded-md border-t border-[#111] border-b border-[#444]" />
               {/* Notch/Thumb groove */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 sm:w-20 h-1 sm:h-2 bg-[#111] rounded-b-sm sm:rounded-b-md" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Highlights / Bento Grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-[1000px] mx-auto">
        <div className="mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter text-white">
            Get the highlights.
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-[#86868b] mt-4 max-w-2xl font-medium">
            Built from the ground up for the deaf and hard of hearing community, featuring breakthrough AI models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[300px]">
          {/* Spatial Computing */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="md:col-span-2 bg-[#0a0a0a] rounded-[2.5rem] p-10 relative overflow-hidden group border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFFF]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Abstract Hand Tracking Visual */}
            <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-gradient-to-br from-[#00FFFF]/20 to-transparent rounded-full blur-3xl group-hover:bg-[#00FFFF]/30 transition-colors duration-500" />
            <div className="absolute bottom-10 right-10 w-64 h-64 border border-white/10 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
              <div className="w-48 h-48 border border-white/20 rounded-full flex items-center justify-center">
                <div className="w-32 h-32 border border-[#00FFFF]/50 rounded-full flex items-center justify-center relative">
                  <Sparkles className="w-12 h-12 text-[#00FFFF] absolute" />
                  {/* Tracking dots */}
                  <div className="absolute top-0 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
                  <div className="absolute bottom-4 left-4 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
                  <div className="absolute bottom-4 right-4 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
                </div>
              </div>
            </div>

            <div className="relative z-10 h-full flex flex-col">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 tracking-tight text-white">Spatial Computing.</h3>
              <p className="text-[#86868b] text-sm sm:text-base md:text-lg max-w-sm">Pixel-perfect hand tracking powered by advanced computer vision.</p>
            </div>
          </motion.div>

          {/* Zero Latency */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-[#0a0a0a] rounded-[2.5rem] p-10 relative overflow-hidden group border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#FF00FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#FF00FF]/10 to-transparent" />
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
              <div className="relative flex items-center justify-center group-hover:-translate-y-2 transition-transform duration-500">
                <div className="absolute inset-0 bg-[#FF00FF] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <Zap className="w-20 h-20 text-[#FF00FF] relative z-10" />
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 tracking-tight text-white">&lt; 10ms</h3>
              <p className="text-[#86868b] text-sm sm:text-base md:text-lg">Zero latency translation.</p>
            </div>
          </motion.div>

          {/* Global Accessibility */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="bg-[#0a0a0a] rounded-[2.5rem] p-10 relative overflow-hidden group border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#00FFFF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
              <div className="relative flex items-center justify-center group-hover:rotate-12 transition-transform duration-700">
                <div className="absolute inset-0 bg-[#00FFFF] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <Globe className="w-20 h-20 text-[#00FFFF] relative z-10" />
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 tracking-tight text-white">100+</h3>
              <p className="text-[#86868b] text-sm sm:text-base md:text-lg">Languages supported globally.</p>
            </div>
          </motion.div>

          {/* Privacy First */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="md:col-span-2 bg-[#0a0a0a] rounded-[2.5rem] p-10 relative overflow-hidden group border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] border-[1px] border-green-500/20 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
              <div className="w-[300px] h-[300px] border-[1px] border-green-500/30 rounded-full flex items-center justify-center">
                <div className="w-[200px] h-[200px] border-[1px] border-green-500/40 rounded-full flex items-center justify-center bg-green-500/5 backdrop-blur-sm">
                  <Shield className="w-24 h-24 text-green-400" />
                </div>
              </div>
            </div>

            <div className="relative z-10 h-full flex flex-col">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 tracking-tight text-white">Privacy First.</h3>
              <p className="text-[#86868b] text-sm sm:text-base md:text-lg max-w-sm">Edge-computed processing. Your video never leaves your device.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-[1000px] mx-auto border-t border-white/10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter text-white">Powered by advanced AI.</h2>
          <p className="text-base sm:text-lg md:text-xl text-[#86868b] mt-4 max-w-2xl mx-auto font-medium">
            We built a custom inference engine that runs directly in your browser, ensuring zero latency and absolute privacy.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* Real-time */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="pt-8 md:pt-0 md:px-8 first:pt-0 first:px-0 last:px-0 last:pl-8 flex flex-col items-center text-center group"
          >
            <div className="text-5xl font-bold text-white mb-4 tracking-tighter group-hover:scale-110 transition-transform duration-500">60 FPS</div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-time tracking</h3>
            <p className="text-[#86868b] text-sm">Hardware-accelerated WebGL and WebGPU bring desktop-class AI to any device.</p>
          </motion.div>

          {/* Accuracy */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="pt-8 md:pt-0 md:px-8 flex flex-col items-center text-center group"
          >
            <div className="text-5xl font-bold text-white mb-4 tracking-tighter group-hover:scale-110 transition-transform duration-500">99.8%</div>
            <h3 className="text-lg font-semibold text-white mb-2">Flawless precision</h3>
            <p className="text-[#86868b] text-sm">Trained on millions of hours of diverse sign language data for unmatched accuracy.</p>
          </motion.div>

          {/* Privacy */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-8 md:pt-0 md:px-8 flex flex-col items-center text-center group"
          >
            <div className="text-5xl font-bold text-white mb-4 tracking-tighter group-hover:scale-110 transition-transform duration-500">Zero</div>
            <h3 className="text-lg font-semibold text-white mb-2">Cloud dependency</h3>
            <p className="text-[#86868b] text-sm">Your video stream never leaves your device. All processing happens locally.</p>
          </motion.div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="py-16 sm:py-24 overflow-hidden bg-[#050507] border-t border-white/10">
        <div className="max-w-[1000px] mx-auto text-center px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter mb-4 text-white">A complete meeting platform.</h2>
            <p className="text-base sm:text-lg md:text-xl text-[#86868b] mb-12 sm:mb-16">Everything you need, built right in.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-[#0a0a0a] rounded-[2rem] p-8 border border-white/10 hover:border-white/20 transition-all duration-500 relative overflow-hidden group"
            >
              <Globe className="w-10 h-10 text-white/80 mb-6 relative z-10 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-2 text-white relative z-10">Browser Native.</h3>
              <p className="text-[#86868b] relative z-10">No downloads or plugins required. Works instantly in Chrome, Safari, and Edge.</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#0a0a0a] rounded-[2rem] p-8 border border-white/10 hover:border-white/20 transition-all duration-500 relative overflow-hidden group"
            >
              <Video className="w-10 h-10 text-white/80 mb-6 relative z-10 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-2 text-white relative z-10">Purpose-Built.</h3>
              <p className="text-[#86868b] relative z-10">A standalone video conferencing platform optimized specifically for sign language.</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-[#0a0a0a] rounded-[2rem] p-8 border border-white/10 hover:border-white/20 transition-all duration-500 relative overflow-hidden group"
            >
              <Lock className="w-10 h-10 text-white/80 mb-6 relative z-10 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-2 text-white relative z-10">Enterprise Secure.</h3>
              <p className="text-[#86868b] relative z-10">End-to-end encrypted architecture designed for the most demanding corporate environments.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#00FFFF]/5" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-[600px] mx-auto text-center relative z-10"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter mb-6 text-white">Ready to break the barrier?</h2>
          <p className="text-base sm:text-lg md:text-xl text-[#86868b] mb-8">Join thousands of users experiencing seamless sign language translation today.</p>
          <button 
            onClick={handleStartMeeting}
            className="bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            Start Meeting Now
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050507] pt-20 pb-10 px-6 border-t border-white/10">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-[#00FFFF]" />
                <span className="font-semibold text-white">Samjho AI</span>
              </div>
              <p className="text-[#86868b] text-sm mb-6">Understand everyone. Instantly.</p>
              <div className="flex gap-4">
                <a href="#" className="text-[#86868b] hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-[#86868b] hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                <a href="#" className="text-[#86868b] hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-[#86868b]">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-[#86868b]">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-[#86868b]">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#86868b] text-center md:text-left">
            <p>Copyright © 2026 Samjho AI Inc. All rights reserved.</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
              <span>1. Translation latency varies by network.</span>
              <span>2. Currently in beta.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
