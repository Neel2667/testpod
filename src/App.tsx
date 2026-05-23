import { useRef, useState, useEffect, useCallback } from 'react';
import { BroadcastScreen } from './components/BroadcastScreen';
import { OperatorDashboard } from './components/OperatorDashboard';
import { startAutopilot } from './services/autopilot';
import { useBroadcastStore } from './store/broadcastStore';

// Check if we're in stream mode (headless playout — no dashboard, auto-start)
const isStreamMode = new URLSearchParams(window.location.search).has('stream_mode');

export default function App() {
  const started = useRef(false);
  const [needsClick, setNeedsClick] = useState(!isStreamMode);
  const [showOperator, setShowOperator] = useState(true);

  const { youtubeChatActive, addChatMessage } = useBroadcastStore();
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auto-start in stream_mode (headless / Hugging Face) ──
  useEffect(() => {
    if (!isStreamMode) return;
    if (started.current) return;
    started.current = true;

    // Warm up audio context immediately (autoplay policy bypassed by server flags)
    const warmup = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          if (ctx.state === 'suspended') await ctx.resume();
          ctx.close();
        }
      } catch {}
    };
    warmup();
    startAutopilot();
  }, []);

  // ── Ctrl+O to toggle operator panel ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        setShowOperator(v => !v);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ── YouTube Live Chat Poller ──
  useEffect(() => {
    if (!youtubeChatActive) {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch('/api/youtube-chat/poll');
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages && Array.isArray(data.messages)) {
          data.messages.forEach((msg: any) => {
            addChatMessage({
              user: msg.author || 'viewer',
              text: msg.message || '',
              avatarColor: '#0071E3',
            });
          });
        }
      } catch {}
    };

    chatPollRef.current = setInterval(poll, 3000);
    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [youtubeChatActive, addChatMessage]);

  const handleStart = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setNeedsClick(false);

    // Warm up speechSynthesis inside user gesture
    if (typeof speechSynthesis !== 'undefined') {
      const warmup = new SpeechSynthesisUtterance('');
      warmup.volume = 0;
      speechSynthesis.speak(warmup);
      speechSynthesis.cancel();
    }

    startAutopilot();
  }, []);

  // ── STREAM MODE: Clean 16:9 fullscreen, no dashboard ──
  if (isStreamMode) {
    return (
      <div className="w-screen h-screen overflow-hidden" style={{ background: '#08080A' }}>
        <BroadcastScreen streamMode />
      </div>
    );
  }

  // ── NEEDS CLICK: Launch screen ──
  if (needsClick) {
    return (
      <div className="h-screen w-screen overflow-hidden flex items-center justify-center" style={{ background: '#05050A' }}>
        <div className="flex flex-col items-center gap-8">
          {/* Animated vault background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #0071E3 0%, transparent 70%)', animation: 'pulse 4s ease-in-out infinite' }} />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #A550DE 0%, transparent 70%)', animation: 'pulse 5s ease-in-out 1s infinite' }} />
          </div>

          {/* Logo */}
          <div className="relative">
            <div className="w-24 h-24 rounded-[28px] flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg, #0071E3, #A550DE)', boxShadow: '0 20px 60px rgba(0,113,227,0.4)' }}>
              <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="22" width="36" height="22" rx="4" />
                <path d="M14 22V16a10 10 0 0 1 20 0v6" />
                <circle cx="24" cy="32" r="3" fill="white" stroke="none" />
                <line x1="24" y1="35" x2="24" y2="38" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#34C759' }}>
              <span className="text-[8px] font-bold text-white">AI</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-[36px] font-bold text-white tracking-tight">The Hidden Vault</h1>
            <p className="text-[14px] text-white/40 mt-1">Autonomous AI Broadcast Engine</p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="text-[10px] text-white/25 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#34C759] inline-block" />Edge-TTS Neural Voice</span>
              <span className="text-[10px] text-white/25 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] inline-block" />Gemini / Groq AI Scripts</span>
              <span className="text-[10px] text-white/25 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#A550DE] inline-block" />YouTube RTMP Streaming</span>
            </div>
          </div>

          {/* CTA */}
          <button
            id="start-broadcast-btn"
            onClick={handleStart}
            className="flex items-center gap-3 px-10 py-4 rounded-2xl text-white text-[15px] font-bold shadow-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0071E3, #5856D6)', boxShadow: '0 8px 30px rgba(0,113,227,0.4)' }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Launch Broadcast
          </button>
          <p className="text-[11px] text-white/20">Click to unlock audio context & begin autonomous broadcast</p>

          {/* Operator hint */}
          <div className="absolute bottom-6 right-6 flex items-center gap-1.5">
            <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>Ctrl+O</kbd>
            <span className="text-[9px] text-white/20">Toggle Operator Panel</span>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN: Split Layout (Playout 75% | Dashboard 25%) ──
  return (
    <div className="h-screen w-screen overflow-hidden flex" style={{ background: '#02020A' }}>
      {/* Broadcast Playout Viewport */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={{ background: '#08080A', minWidth: 0 }}
      >
        {/* Operator toggle button overlaid on playout */}
        <button
          onClick={() => setShowOperator(v => !v)}
          className="absolute top-3 right-3 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:opacity-100 opacity-40"
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 10 }}
          title="Toggle operator panel (Ctrl+O)"
        >
          <span>{showOperator ? '◀' : '▶'}</span>
          <span className="font-mono uppercase tracking-wider">OPS</span>
        </button>

        {/* 16:9 constrained playout */}
        <div className="w-full h-full max-h-screen" style={{ aspectRatio: '16/9', maxWidth: 'calc(100vh * 16 / 9)' }}>
          <BroadcastScreen />
        </div>
      </div>

      {/* Operator Dashboard Panel */}
      {showOperator && (
        <div className="flex-shrink-0 w-[320px] overflow-hidden" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
          <OperatorDashboard />
        </div>
      )}
    </div>
  );
}
