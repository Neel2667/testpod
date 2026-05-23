import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useBroadcastStore } from '../store/broadcastStore';
import type { CenterVisual } from '../types';
import { getAudioAnalyser } from '../services/tts';
import { X, Lock, CheckCircle2, Flame } from 'lucide-react';

const hostImg = '/images/host.png';
const guestImg = '/images/guest.png';

const SEG_COLORS: Record<number, string> = {
  1: '#0071E3',
  2: '#34C759',
  3: '#FF9500',
  4: '#FF3B30',
  5: '#A550DE'
};

/* ═══════════ LIVE CHAT COMPONENT ═══════════ */
function LiveChat(_props: { topic: string; currentLineIndex: number }) {
  const chatMessages = useBroadcastStore(s => s.chatMessages);
  const addChatMessage = useBroadcastStore(s => s.addChatMessage);
  const isPlaying = useBroadcastStore(s => s.isPlaying);
  const tickCountRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) return;

    // Seed initial messages if empty
    if (useBroadcastStore.getState().chatMessages.length === 0) {
      const users = ['cyber_explorer', 'pixel_pioneer', 'quantum_coder', 'tech_nomad', 'luna_seeker', 'void_watcher', 'neon_rider', 'alpha_mind'];
      const comments = ["Wait, is this real?", "No way...", "Look at the data! 🤯", "Subscribed!", "Is this actual declassified info?", "Marcus is cooking today 🔥"];
      const colors = ['#FF3B30', '#0071E3', '#34C759', '#FF9500', '#A550DE'];
      for (let i = 0; i < 3; i++) {
        addChatMessage({
          user: users[Math.floor(Math.random() * users.length)],
          text: comments[Math.floor(Math.random() * comments.length)],
          avatarColor: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }

    const users = [
      'cyber_explorer', 'pixel_pioneer', 'quantum_coder', 'tech_nomad', 
      'luna_seeker', 'void_watcher', 'neon_rider', 'alpha_mind', 
      'meta_vision', 'future_architect', 'cryptic_node', 'truth_hunter',
      'deep_dive', 'system_ghost', 'ai_enthusiast', 'stellar_gazer'
    ];

    const comments = [
      "Wait, is this real?", "No way...", "Look at the data! 🤯", 
      "Subscribed!", "Is this actual declassified info?", "Marcus is cooking today 🔥", 
      "Wait, what did they say?", "Mind blown 🧠", "Whoa, that statistic is crazy!", 
      "Can we get the link to this database?", "This is wild.", "Following!", 
      "First time watching this live!", "Crazy theory but it makes sense.", 
      "Speechless.", "This is breaking news status", "Hold on, let me check that again", 
      "Unbelievable 🚀", "Big if true!", "They actually said this?", "Wow..."
    ];

    const simulatedTopics = [
      "Hollow Earth Entrances",
      "HAARP Weather Control",
      "Simulation Glitches",
      "Black Knight Satellite",
      "Lost Tesla Schematics",
      "The Phoenix Lights Protocol",
      "Anunnaki DNA Keys"
    ];

    const merchKeys = ['hoodie', 'dossier', 'cap'];

    const colors = [
      '#FF3B30', '#0071E3', '#34C759', '#FF9500', '#A550DE', '#5AC8FA', '#FF2D55'
    ];

    const interval = setInterval(() => {
      tickCountRef.current++;
      
      // Inject monetization command every 15 messages (~42 seconds)
      if (tickCountRef.current % 15 === 0) {
        const commandType = Math.floor(Math.random() * 3);
        let commandText = '';
        if (commandType === 0) {
          const amount = [5, 15, 50, 100][Math.floor(Math.random() * 4)];
          commandText = `!tip ${amount}`;
        } else if (commandType === 1) {
          const topic = simulatedTopics[Math.floor(Math.random() * simulatedTopics.length)];
          commandText = `!sponsor ${topic}`;
        } else {
          const item = merchKeys[Math.floor(Math.random() * merchKeys.length)];
          commandText = `!buy ${item}`;
        }

        addChatMessage({
          user: users[Math.floor(Math.random() * users.length)],
          text: commandText,
          avatarColor: colors[Math.floor(Math.random() * colors.length)]
        });
      } else {
        addChatMessage({
          user: users[Math.floor(Math.random() * users.length)],
          text: comments[Math.floor(Math.random() * comments.length)],
          avatarColor: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [isPlaying, addChatMessage]);

  return (
    <div className="absolute bottom-[52px] left-6 z-30 w-[280px] max-h-[220px] flex flex-col pointer-events-none select-none">
      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#08080A] to-transparent z-10" />
      <div className="overflow-hidden flex-1 flex flex-col justify-end gap-1.5 pt-6 pb-2">
        {chatMessages.map((m) => {
          const isSys = m.isSystem;
          return (
            <div key={m.id} className={`flex items-start gap-2 backdrop-blur-md border rounded-xl p-2 slide-in-chat animate-fade-in ${
              isSys
                ? 'bg-amber-950/40 border-amber-500/30 shadow-md shadow-amber-500/5'
                : 'bg-black/40 border-white/5'
            }`}>
              <div 
                className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white uppercase"
                style={{ backgroundColor: isSys ? '#FF9500' : m.avatarColor }}
              >
                {isSys ? '⚡' : m.user[0]}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className={`text-[10px] font-bold block leading-tight ${isSys ? 'text-amber-400' : 'text-white/70'}`}>
                  {m.user}
                </span>
                <span className={`text-[10.5px] leading-tight block mt-0.5 ${isSys ? 'text-amber-100 font-semibold' : 'text-white/90'}`}>
                  {m.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BroadcastScreen({ streamMode = false }: { streamMode?: boolean }) {
  const {
    currentBroadcast,
    config,
    isPlaying,
    currentLineIndex,
    activeSpeaker,
    showIntro,
    showUpNext,
    episodeNumber,
    showMonetizationHub,
    setMonetizationHubOpen,
    reactionTrigger,
    clearReaction,
  } = useBroadcastStore();

  const [ltVis, setLtVis] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [prevSpeaker, setPrevSpeaker] = useState<string | null>(null);
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [milestone, setMilestone] = useState<{ icon: string; text: string } | null>(null);

  // Trigger floating emoji reactions swarm
  useEffect(() => {
    if (reactionTrigger) {
      const emoji = reactionTrigger.emoji;
      const newReactions = Array.from({ length: 12 }).map((_, i) => ({
        id: Date.now() + Math.random() + i,
        emoji,
        x: 10 + Math.random() * 80,
      }));
      setReactions(prev => [...prev.slice(-40), ...newReactions]);
      clearReaction();
    }
  }, [reactionTrigger, clearReaction]);

  // Milestone timer
  useEffect(() => {
    if (!isPlaying) {
      setMilestone(null);
      return;
    }
    const milestones = [
      { icon: '🔥', text: '10,000 Likes reached!' },
      { icon: '🚀', text: '500 Shares reached!' },
      { icon: '👥', text: '15,000 active viewers!' },
      { icon: '💬', text: 'Chat is trending #1!' },
      { icon: '👑', text: '@truth_seeker sent a Gold Badge!' },
      { icon: '⭐', text: 'Broadcast shared to X!' }
    ];
    let idx = 0;
    const interval = setInterval(() => {
      setMilestone(milestones[idx % milestones.length] || null);
      idx++;
      setTimeout(() => setMilestone(null), 4000);
    }, 18000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Continuous reactions stream
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const emojis = ['🔥', '❤️', '👍', '😮', '🚀', '✨', '⚡', '💯'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      const newReaction = {
        id: Date.now() + Math.random(),
        emoji: randomEmoji,
        x: 72 + Math.random() * 20
      };
      setReactions(prev => [...prev.slice(-30), newReaction]);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const script = currentBroadcast?.script ?? [];
  const line = script[currentLineIndex] ?? null;
  const ready = currentBroadcast?.state === 'ready_for_review' || currentBroadcast?.state === 'broadcasting';

  // Show/hide lower third when line changes
  useEffect(() => {
    if (isPlaying && line) {
      setLtVis(false);
      const t = setTimeout(() => setLtVis(true), 250);
      return () => clearTimeout(t);
    }
    setLtVis(false);
  }, [isPlaying, currentLineIndex]);

  // Speaker switch flash
  useEffect(() => {
    if (line && line.speaker !== prevSpeaker && prevSpeaker !== null) {
      setFlashKey(k => k + 1);
    }
    setPrevSpeaker(line?.speaker ?? null);
  }, [currentLineIndex]);

  // Reactions on stats/quotes
  useEffect(() => {
    if (!line || !isPlaying) return;
    const t = line.center_visual.type;
    if (t === 'stat' || t === 'quote' || t === 'comparison') {
      const emojis = t === 'stat' ? ['🔥', '⚡', '💥'] : t === 'quote' ? ['💡', '✨', '🎯'] : ['⚡', '🔥', '💡'];
      const timer = setTimeout(() => {
        const newR = emojis.map((emoji, i) => ({ id: Date.now() + i, emoji, x: 20 + Math.random() * 60 }));
        setReactions(newR);
        setTimeout(() => setReactions([]), 1800);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentLineIndex, isPlaying]);

  const totalPct = script.length > 0 ? ((currentLineIndex + 0.5) / script.length) * 100 : 0;
  const segColor = line ? (SEG_COLORS[line.segment] ?? '#0071E3') : '#0071E3';

  const tickers = useMemo(() =>
    isPlaying && line
      ? script.slice(Math.max(0, currentLineIndex - 1), currentLineIndex + 5).map((l, idx) => {
          const icons = ['🚨', '🔥', '🌐', '📡', '💡'];
          const icon = icons[idx % icons.length];
          return `${icon} ${l.ticker_text}`;
        })
      : ['🚨 The Hidden Vault — Unlocking What They Don\'t Want You To Know', '📡 New Episode Every Week', '🔥 Subscribe & Hit the Bell'],
    [isPlaying, currentLineIndex, script, line]);
  
  const segName = useCallback((s: number) =>
    ({ 1: 'Intro Logo Sting', 2: 'Episode Promo / Hook', 3: 'Main Programme', 4: 'Outro Credits', 5: 'End Channel Promo' })[s] ?? `Segment ${s}`, []);

  // Coming up next
  const showComingUp = isPlaying && line && (currentLineIndex % 4 === 3) && currentLineIndex < script.length - 2;
  const nextSegLine = showComingUp ? script[currentLineIndex + 1] : null;

  return (
    <div className="relative w-full h-full overflow-hidden select-none text-white/95" style={{ background: '#08080A' }}>
      
      {/* ════ BASE STAGE LAYER ════ */}
      <AnimatedBG speaker={activeSpeaker} playing={isPlaying} segColor={segColor} />
      {/* Floating particles */}
      {isPlaying && <Particles />}

      {/* Milestone Alert Notification */}
      {milestone && (
        <div className="absolute top-[80px] left-4 z-40 slide-in-alert pointer-events-none">
          <div className="flex items-center gap-2 bg-black/85 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 shadow-xl shadow-black/40">
            <span className="text-base">{milestone.icon}</span>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{milestone.text}</span>
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-10 flex flex-col">
        {/* Progress bar at very top */}
        {isPlaying && (
          <div className="h-[3px] w-full bg-white/[0.04] flex-shrink-0 relative z-40">
            <div className="h-full transition-all duration-200" style={{ width: `${totalPct}%`, background: `linear-gradient(90deg, #0071E3, ${segColor})` }} />
            {/* segment markers */}
            {[1, 2, 3, 4].map(i => {
              const pos = (i / 5) * 100;
              return <div key={i} className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: `${pos}%` }} />;
            })}
          </div>
        )}

        <Header live={isPlaying} title={currentBroadcast?.title} />
        <LogoBanner playing={isPlaying} />

        {/* Speaker switch flash overlay */}
        {flashKey > 0 && <div key={flashKey} className="absolute inset-0 z-30 pointer-events-none speaker-flash" style={{ background: `radial-gradient(ellipse at ${activeSpeaker === 'Host' ? '33%' : '67%'} 50%, ${activeSpeaker === 'Host' ? 'rgba(0,113,227,0.12)' : 'rgba(165,80,222,0.12)'}, transparent 70%)` }} />}

        {/* ════ STAGE ════ */}
        <div className="flex-1 flex flex-col justify-start pt-6 px-4 md:px-8 lg:px-12 pb-[160px] relative min-h-0">
          
          <div className="flex items-start justify-center gap-4 md:gap-10 lg:gap-16 w-full">
            {/* HOST column */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 'clamp(150px,18%,240px)' }}>
              {/* Did you know — above host */}
              <div className="w-full mb-3 min-h-[44px]">
                {isPlaying && line && (currentLineIndex % 3 === 2) && <DidYouKnow key={currentLineIndex} text={line.info_card.split('\n').filter(l => l.trim())[1]?.replace(/^[•\-]\s*/, '') ?? ''} />}
              </div>
              <div className="flex-1 flex items-start relative w-full justify-center">
                <div className="relative">
                  <Person img={hostImg} name={config.hostName} role="Host" speaking={activeSpeaker === 'Host'} dim={isPlaying && activeSpeaker === 'Guest'} color="blue" />
                </div>
              </div>
            </div>

            {/* CENTER column */}
            <div className="flex flex-col items-center justify-start min-w-0" style={{ width: 'clamp(480px,55%,900px)' }}>
              <div className="w-full relative">
                {line && isPlaying ? (
                  <>
                    <CenterDisplay key={currentLineIndex} visual={line.center_visual} />
                    
                    {/* Segment-specific premium CTA boxes overlaid inside CenterDisplay */}
                    {line.segment === 2 && (
                      <div className="absolute bottom-3 inset-x-3 z-20 pop-in" style={{ animationDelay: '0.2s' }}>
                        <div className="relative rounded-xl overflow-hidden p-2.5 flex items-center justify-between gap-3 border border-[#34C759]/30 bg-black/80 backdrop-blur-xl shadow-lg">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-lg bg-[#34C759]/20 flex items-center justify-center text-sm animate-bounce">
                              🎯
                            </div>
                            <div className="text-left">
                              <h4 className="text-[9px] font-bold text-[#34C759] tracking-wider uppercase leading-none">Coming Up Next</h4>
                              <p className="text-[10.5px] font-medium text-white/80 mt-0.5 leading-none">
                                Full investigation & guest interview.
                              </p>
                            </div>
                          </div>
                          <span className="text-[8px] font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                            SEGMENT 2
                          </span>
                        </div>
                      </div>
                    )}

                    {line.segment === 5 && (
                      <div className="absolute bottom-3 inset-x-3 z-20 pop-in" style={{ animationDelay: '0.2s' }}>
                        <div className="relative rounded-xl overflow-hidden p-2.5 flex items-center justify-between gap-3 border border-[#A550DE]/30 bg-black/80 backdrop-blur-xl shadow-lg">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-lg bg-[#A550DE]/20 flex items-center justify-center text-sm animate-pulse">
                              🔔
                            </div>
                            <div className="text-left">
                              <h4 className="text-[9px] font-bold text-[#A550DE] tracking-wider uppercase leading-none">SUPPORT THE VAULT</h4>
                              <p className="text-[10.5px] font-medium text-white/80 mt-0.5 leading-none">
                                Subscribe for weekly declassified updates.
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => alert('Thanks for subscribing to The Hidden Vault!')}
                            className="bg-gradient-to-r from-[#0071E3] to-[#A550DE] text-white px-3 py-1.5 rounded-lg text-[9px] font-bold shadow-md cursor-pointer active:scale-95 transition-transform duration-100"
                          >
                            SUBSCRIBE
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : ready && !isPlaying ? (
                  <div className="w-full shadow-2xl rounded-[28px] overflow-hidden border border-white/10 p-12 flex justify-center items-center" style={{ background: 'rgba(11, 11, 13, 0.8)', backdropFilter: 'blur(30px)' }}>
                    <ReadyScreen topic={currentBroadcast?.title} />
                  </div>
                ) : null}
              </div>
              
              {/* Subtitle / Caption inline inside Center Column flow */}
              {line && isPlaying && (
                <div className={`w-full mt-4 pop-in ${ltVis ? 'lt-in' : 'lt-out'}`}>
                  <Subtitle name={line.speaker === 'Host' ? config.hostName : config.guestName}
                    role={line.speaker === 'Host' ? 'Host' : 'Expert'} text={line.text} lineKey={currentLineIndex}
                    color={line.speaker === 'Host' ? 'blue' : 'purple'} />
                </div>
              )}
            </div>

            {/* GUEST column */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 'clamp(150px,18%,240px)' }}>
              {/* Coming up & Socials — above guest */}
              <div className="w-full mb-3 min-h-[44px] flex justify-end">
                {(isPlaying && line && currentLineIndex % 5 === 3) ? (
                  <SocialNotification key={`social-${currentLineIndex}`} />
                ) : (
                  showComingUp && nextSegLine && <ComingUpNext text={segName(nextSegLine.segment)} />
                )}
              </div>
              <div className="flex-1 flex items-start relative w-full justify-center">
                <div className="relative">
                  <Person img={guestImg} name={config.guestName} role="Expert" speaking={activeSpeaker === 'Guest'} dim={isPlaying && activeSpeaker === 'Host'} color="purple" />
                </div>
              </div>
            </div>
          </div>

          {/* Chat Feed */}
          {isPlaying && <LiveChat topic={currentBroadcast?.title || ''} currentLineIndex={currentLineIndex} />}

          {/* Broadcast commands instructions watermark overlay — hidden in stream_mode */}
          {isPlaying && !streamMode && (
            <div className="absolute bottom-[52px] right-6 z-30 w-[280px] backdrop-blur-md bg-black/55 border border-white/10 rounded-2xl p-3 select-none pointer-events-none text-left slide-in-chat animate-fade-in shadow-xl">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-white tracking-widest uppercase font-mono">Vault Playout HUD</span>
                </div>
                <span className="text-[7px] text-[#34C759] font-bold font-mono tracking-wider uppercase bg-[#34C759]/10 px-1.5 py-0.5 rounded">Auto</span>
              </div>
              <p className="text-[8px] text-white/50 leading-relaxed uppercase tracking-wider mb-2">
                Interactive broadcast triggers via simulated chat commands:
              </p>
              <div className="space-y-1.5 text-[9.5px] font-mono text-white/90">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-amber-400 font-bold font-sans">!tip [5/15/50]</span>
                  <span className="text-white/40">→</span>
                  <span className="text-white/70 font-sans">Secure ZK-Tip</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-amber-400 font-bold font-sans">!sponsor [topic]</span>
                  <span className="text-white/40">→</span>
                  <span className="text-white/70 font-sans">Queue next topic</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-amber-400 font-bold font-sans">!buy [item]</span>
                  <span className="text-white/40">→</span>
                  <span className="text-white/70 font-sans">Order drop merch</span>
                </div>
              </div>
              <div className="mt-2 text-[7.5px] text-white/30 uppercase font-mono tracking-widest text-center border-t border-white/5 pt-1.5">
                Merch items: hoodie, dossier, cap
              </div>
            </div>
          )}

          {/* Reaction emojis */}
          {reactions.map(r => (
            <div key={r.id} className="absolute bottom-20 reaction-float pointer-events-none z-30" style={{ left: `${r.x}%` }}>
              <span className="text-2xl">{r.emoji}</span>
            </div>
          ))}
        </div>

        <Ticker items={tickers} />
      </div>

      {/* Overlays */}
      {!currentBroadcast && <Idle />}
      {showIntro && <Intro />}
      {showUpNext && <UpNextScreen episodeNumber={episodeNumber} />}

      {/* Monetization Drawer Panel */}
      <MonetizationHub isOpen={showMonetizationHub} onClose={() => setMonetizationHubOpen(false)} />
      
    </div>
  );
}

/* ═══════════ FLOATING PARTICLES ═══════════ */
function Particles() {
  const particles = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: 2 + Math.random() * 3, dur: 12 + Math.random() * 18,
    dx: (Math.random() - 0.5) * 120, dy: (Math.random() - 0.5) * 80, delay: Math.random() * 10,
    color: ['#0071E3', '#A550DE', '#34C759', '#FF9500'][Math.floor(Math.random() * 4)],
  })), []);
  return (
    <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full" style={{
          left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, backgroundColor: p.color, opacity: 0.15,
          ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px`,
          animation: `particleDrift ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
        }} />
      ))}
    </div>
  );
}

/* ═══════════ SOCIAL NOTIFICATION ═══════════ */
function SocialNotification() {
  const [show, setShow] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShow(false), 5500); return () => clearTimeout(t); }, []);
  if (!show) return null;
  return (
    <div className="pop-in w-full flex justify-end">
      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xl rounded-xl px-2.5 py-1.5 shadow-md border border-white/10">
        <div className="flex -space-x-1.5 flex-shrink-0 mt-[1px]">
          <span className="w-[16px] h-[16px] flex items-center justify-center rounded-full bg-[#FF3B30] text-white text-[8px] shadow-sm z-30 animate-pulse">🔔</span>
          <span className="w-[16px] h-[16px] flex items-center justify-center rounded-full bg-[#0071E3] text-white text-[8px] shadow-sm z-20">👍</span>
          <span className="w-[16px] h-[16px] flex items-center justify-center rounded-full bg-[#34C759] text-white text-[8px] shadow-sm z-10">💬</span>
        </div>
        <div className="min-w-0 text-left ml-1">
          <p className="text-[7px] font-semibold text-[#FF3B30] tracking-wider mb-[1px] uppercase">SUPPORT US</p>
          <p className="text-[9px] text-white/70 leading-snug font-medium whitespace-nowrap">Subscribe, Like & Share</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ DID YOU KNOW ═══════════ */
function DidYouKnow({ text }:{ text: string }) {
  const [show, setShow] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShow(false), 5000); return () => clearTimeout(t); }, []);
  if (!show || !text) return null;
  return (
    <div className="pop-in w-full">
      <div className="flex items-start gap-1.5 bg-black/60 backdrop-blur-xl rounded-xl px-2.5 py-1.5 shadow-md border border-white/10">
        <span className="text-xs flex-shrink-0 mt-[1px]">💡</span>
        <div className="min-w-0">
          <p className="text-[7px] font-semibold text-[#FF9500] tracking-wider mb-[1px]">DID YOU KNOW</p>
          <p className="text-[9px] text-white/75 leading-snug line-clamp-2">{text}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ COMING UP NEXT ═══════════ */
function ComingUpNext({ text }:{ text: string }) {
  return (
    <div className="coming-up-anim">
      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xl rounded-full px-2.5 py-[3px] shadow-sm border border-white/10">
        <span className="text-[7px] font-semibold text-[#A550DE] tracking-wider">COMING UP</span>
        <span className="text-[8px] text-white/70 truncate">{text}</span>
        <span className="text-[9px] text-white/50">→</span>
      </div>
    </div>
  );
}


/* ═══════════ ANIMATED BG ═══════════ */
function AnimatedBG({ speaker, playing, segColor }:{ speaker: 'Host' | 'Guest' | null; playing: boolean; segColor: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#08080A' }}>
      <div className="absolute rounded-full transition-all duration-[1500ms]"
        style={{ width: 340, height: 340, top: '-5%', left: '5%', background: `radial-gradient(circle, ${segColor}20 0%, transparent 70%)`, animation: 'blobFloat1 18s ease-in-out infinite, colorShift 20s ease-in-out infinite', opacity: speaker === 'Host' ? 0.8 : 0.3 }} />
      <div className="absolute rounded-full transition-all duration-[1500ms]"
        style={{ width: 400, height: 400, bottom: '-10%', right: '0%', background: `radial-gradient(circle, ${segColor}18 0%, transparent 70%)`, animation: 'blobFloat2 22s ease-in-out infinite, colorShift 25s ease-in-out 5s infinite', opacity: speaker === 'Guest' ? 0.8 : 0.3 }} />
      <div className="absolute rounded-full" style={{ width: 280, height: 280, top: '30%', left: '40%', background: 'radial-gradient(circle, rgba(90,200,250,0.06) 0%, transparent 70%)', animation: 'blobFloat3 25s ease-in-out infinite' }} />
      <div className="absolute rounded-full" style={{ width: 220, height: 220, top: '60%', left: '15%', background: 'radial-gradient(circle, rgba(52,199,89,0.05) 0%, transparent 70%)', animation: 'blobFloat2 20s ease-in-out 3s infinite' }} />
      <div className="absolute rounded-full" style={{ width: 260, height: 260, top: '10%', right: '20%', background: 'radial-gradient(circle, rgba(255,149,0,0.05) 0%, transparent 70%)', animation: 'blobFloat1 28s ease-in-out 2s infinite' }} />
      {playing && (<>
        <div className="absolute top-[12%] left-0 right-0 overflow-hidden whitespace-nowrap opacity-[0.03] pointer-events-none"><div className="scroll-text-left inline-block"><span className="text-[80px] font-bold tracking-[0.15em] select-none" style={{ color: segColor }}>THE HIDDEN VAULT · THE HIDDEN VAULT · THE HIDDEN VAULT · THE HIDDEN VAULT · THE HIDDEN VAULT ·&nbsp;</span><span className="text-[80px] font-bold tracking-[0.15em] select-none" style={{ color: segColor }}>THE HIDDEN VAULT · THE HIDDEN VAULT · THE HIDDEN VAULT · THE HIDDEN VAULT · THE HIDDEN VAULT ·&nbsp;</span></div></div>
        <div className="absolute top-[45%] left-0 right-0 overflow-hidden whitespace-nowrap opacity-[0.02] pointer-events-none"><div className="scroll-text-right inline-block"><span className="text-[120px] font-black tracking-[0.3em] text-[#A550DE] select-none">VAULT · VAULT · VAULT · VAULT · VAULT · VAULT · VAULT · VAULT ·&nbsp;</span><span className="text-[120px] font-black tracking-[0.3em] text-[#A550DE] select-none">VAULT · VAULT · VAULT · VAULT · VAULT · VAULT · VAULT · VAULT ·&nbsp;</span></div></div>
        <div className="absolute top-[78%] left-0 right-0 overflow-hidden whitespace-nowrap opacity-[0.025] pointer-events-none"><div className="scroll-text-slow inline-block"><span className="text-[50px] font-semibold tracking-[0.2em] text-[#34C759] select-none">UNLOCKING WHAT THEY DON'T WANT YOU TO KNOW · UNLOCKING WHAT THEY DON'T WANT YOU TO KNOW ·&nbsp;</span><span className="text-[50px] font-semibold tracking-[0.2em] text-[#34C759] select-none">UNLOCKING WHAT THEY DON'T WANT YOU TO KNOW · UNLOCKING WHAT THEY DON'T WANT YOU TO KNOW ·&nbsp;</span></div></div>
      </>)}
    </div>
  );
}

/* ═══════════ LOGO BANNER ═══════════ */
function LogoBanner({ playing }:{ playing: boolean }) {
  return (
    <div className="flex items-center justify-center py-2 relative z-20">
      <div className="flex items-center gap-3">
        <div style={{ animation: 'eyePulse 3s ease-in-out infinite, eyeGlow 3s ease-in-out infinite' }}>
          <svg viewBox="0 0 36 36" className="w-7 h-7"><defs><linearGradient id="lbG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0071E3" /><stop offset="100%" stopColor="#A550DE" /></linearGradient></defs>
            <rect x="4" y="14" width="28" height="18" rx="3" fill="none" stroke="url(#lbG)" strokeWidth="1.8" /><path d="M10 14V10a8 8 0 0 1 16 0v4" fill="none" stroke="url(#lbG)" strokeWidth="1.8" strokeLinecap="round" /><circle cx="18" cy="22" r="2.5" fill="url(#lbG)" /><line x1="18" y1="24.5" x2="18" y2="27" stroke="url(#lbG)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-white/65 tracking-wide leading-none">The Hidden Vault</p>
          <div className="h-[1.5px] mt-1 rounded-full" style={{ width: '100%', background: 'linear-gradient(90deg, transparent 0%, #0071E3 25%, #A550DE 50%, #0071E3 75%, transparent 100%)', backgroundSize: '200% 100%', animation: playing ? 'shimmer 3s linear infinite' : 'none', opacity: playing ? 0.6 : 0.2 }} />
        </div>
        {playing && <div className="flex items-center gap-1 ml-1"><span className="w-[5px] h-[5px] rounded-full bg-[#FF3B30] animate-pulse" /><span className="text-[9px] font-medium text-[#FF3B30]/70">ON AIR</span></div>}
      </div>
    </div>
  );
}

/* ═══════════ CENTER DISPLAY ═══════════ */
function CenterDisplay({ visual }:{ visual: CenterVisual }) {
  const am: Record<string, string> = { blue: '#0071E3', purple: '#A550DE', green: '#34C759', orange: '#FF9500', red: '#FF3B30' };
  const c = am[visual.accent ?? 'blue'];
  return (
    <div className="pop-in w-full shadow-2xl rounded-[28px] overflow-hidden relative" style={{ animation: 'float 6s ease-in-out infinite' }}>
      <div className="absolute inset-0 video-pan-bg" style={{
        background: 'linear-gradient(135deg, rgba(15, 15, 20, 0.85), rgba(10, 10, 12, 0.65))',
        backdropFilter: 'blur(50px) saturate(220%)', WebkitBackdropFilter: 'blur(50px) saturate(220%)'
      }} />
      <div className="absolute inset-0 video-pan-bg" style={{ background: `linear-gradient(160deg, ${c}15, transparent 65%)` }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, transparent 40%, rgba(255,255,255,0.01) 100%)` }} />
      
      <div className="relative rounded-[28px] overflow-hidden flex flex-col aspect-video w-full max-h-[42vh]" style={{
        boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -2px 10px rgba(0,0,0,0.5)`,
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-30" />
        
        {/* Header container fixed at top */}
        <div className="absolute top-0 inset-x-0 z-10 px-5 pt-4 pb-2 flex items-center gap-2.5 border-b border-white/[0.04] bg-white/[0.01]">
          <div className="w-[8px] h-[8px] rounded-full shadow-sm" style={{ backgroundColor: c, boxShadow: `0 0 8px ${c}40` }} />
          <h3 className="text-[14px] font-bold text-white/90 tracking-tight">{visual.title}</h3>
        </div>
        
        {/* Content container centered */}
        <div className="relative z-10 px-6 pb-6 pt-[52px] flex-1 flex flex-col justify-center items-center">
          {visual.type === 'bullets' && visual.bullets && (
            <div className="space-y-1.5 w-full max-w-[90%]">{visual.bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-2.5 pop-in text-left" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0 mt-[1.5px] text-[10px] font-bold text-white shadow-inner" style={{ backgroundColor: c }}>{i + 1}</div>
                <p className="text-[12px] text-white/75 leading-relaxed pt-[0.5px]">{b}</p>
              </div>
            ))}</div>
          )}
          {visual.type === 'stat' && visual.stat && (
            <div className="text-center py-2 stat-pop">
              <CountUp value={visual.stat.value} color={c} />
              <p className="text-[13px] font-semibold text-white/80 mt-1.5">{visual.stat.label}</p>
              {visual.stat.sub && <p className="text-[11px] text-white/50 mt-0.5">{visual.stat.sub}</p>}
            </div>
          )}
          {visual.type === 'quote' && visual.quote && (
            <div className="py-2 w-full max-w-[85%] text-left"><div className="border-l-[3px] pl-3.5 py-0.5" style={{ borderColor: c }}>
              <p className="text-[12.5px] text-white/85 leading-relaxed italic">"{visual.quote.text}"</p>
              <p className="text-[11px] font-medium mt-1.5" style={{ color: c }}>— {visual.quote.author}</p>
            </div></div>
          )}
          {visual.type === 'diagram' && visual.bullets && (
            <div className="space-y-1 w-full max-w-[80%]">{visual.bullets.map((b, i) => (
              <div key={i} className="pop-in" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
                  <div className="flex-1 rounded-lg px-3 py-1.5 text-[11px] text-white/75 bg-white/[0.02] border border-white/5">{b}</div>
                </div>
                {i < visual.bullets!.length - 1 && <div className="ml-[2px] w-px h-1.5" style={{ backgroundColor: `${c}25` }} />}
              </div>
            ))}</div>
          )}
          {visual.type === 'timeline' && visual.timeline && (
            <div className="space-y-2 w-full max-w-[85%] text-left">{visual.timeline.map((t, i) => (
              <div key={i} className="flex items-start gap-2.5 pop-in" style={{ animationDelay: `${i * 0.09}s` }}>
                <div className="flex flex-col items-center">
                  <div className="w-[8px] h-[8px] rounded-full border-2 flex-shrink-0" style={{ borderColor: c, backgroundColor: i === visual.timeline!.length - 1 ? c : 'transparent' }} />
                  {i < visual.timeline!.length - 1 && <div className="w-px flex-1 min-h-[12px]" style={{ backgroundColor: `${c}25` }} />}
                </div>
                <div className="pb-0.5"><p className="text-[11px] font-bold" style={{ color: c }}>{t.year}</p><p className="text-[11px] text-white/70 leading-snug">{t.event}</p></div>
              </div>
            ))}</div>
          )}
          {visual.type === 'comparison' && visual.comparison && (
            <div className="flex items-center gap-4 py-2 w-full max-w-[85%]">
              <div className="flex-1 text-center stat-pop">
                <div className="rounded-xl py-3 px-2 border border-white/10" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <p className="text-[30px] font-bold leading-none" style={{ color: c }}>{visual.comparison.left}</p>
                </div>
                <p className="text-[10px] text-white/60 mt-1.5 whitespace-pre-line leading-snug">{visual.comparison.leftLabel}</p>
              </div>
              <div className="text-[11px] font-bold text-white/30">VS</div>
              <div className="flex-1 text-center stat-pop" style={{ animationDelay: '0.15s' }}>
                <div className="rounded-xl py-3 px-2 border border-white/10" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <p className="text-[30px] font-bold text-white/70 leading-none">{visual.comparison.right}</p>
                </div>
                <p className="text-[10px] text-white/60 mt-1.5 whitespace-pre-line leading-snug">{visual.comparison.rightLabel}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ COUNT UP ═══════════ */
function CountUp({ value, color }:{ value: string; color: string }) {
  const [display, setDisplay] = useState('');
  const numMatch = value.match(/[\d,.]+/);
  useEffect(() => {
    if (!numMatch) { setDisplay(value); return; }
    const target = parseFloat(numMatch[0].replace(/,/g, ''));
    const prefix = value.slice(0, value.indexOf(numMatch[0]));
    const suffix = value.slice(value.indexOf(numMatch[0]) + numMatch[0].length);
    const steps = 20;
    let step = 0;
    const iv = setInterval(() => {
      step++;
      const current = Math.round((target * step / steps) * 10) / 10;
      const formatted = target >= 100 ? Math.round(current).toLocaleString() : current.toLocaleString();
      setDisplay(`${prefix}${formatted}${suffix}`);
      if (step >= steps) clearInterval(iv);
    }, 30);
    return () => clearInterval(iv);
  }, [value]);
  return <p className="text-[48px] md:text-[64px] lg:text-[76px] font-bold tracking-tight leading-none" style={{ color }}>{display || value}</p>;
}

/* ═══════════ READY SCREEN ═══════════ */
function ReadyScreen({ topic }:{ topic?: string }) {
  return (
    <div className="text-center max-w-xs">
      <div className="w-11 h-11 mx-auto mb-3 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #0071E3, #A550DE)' }}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
      </div>
      {topic && <p className="text-[13px] font-semibold text-white/90 mb-1">{topic}</p>}
      <p className="text-[11px] text-white/50">Ready — press play</p>
    </div>
  );
}

/* ═══════════ SUBTITLE ═══════════ */
function Subtitle({ name, role, text, lineKey, color }:{ name: string; role: string; text: string; lineKey: number; color: 'blue' | 'purple' }) {
  const c = color === 'blue' ? '#0071E3' : '#A550DE';
  const highlighted = text.replace(/(\$[\d,.]+[TBMK]?|\d+%|\d{4}|three|five|trillions|classified|suppression|evidence|irrefutable|unlocked|secret|hidden|truth|conspiracy)/gi, (m) => `⟪${m}⟫`);
  const parts = highlighted.split(/⟪|⟫/);

  return (
    <div className="relative rounded-2xl overflow-hidden transition-all duration-300 w-full" style={{
      background: 'rgba(5, 5, 8, 0.85)',
      backdropFilter: 'blur(30px) saturate(190%)',
      WebkitBackdropFilter: 'blur(30px) saturate(190%)',
      boxShadow: `0 12px 36px rgba(0,0,0,0.5), 0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)`,
      border: `1px solid rgba(255, 255, 255, 0.08)`,
    }}>
      <div className="relative z-10 flex items-center gap-1.5 px-4 py-1.5 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: c, boxShadow: `0 0 8px ${c}` }} />
        <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">{name}</span>
        <span className="text-[9px] text-white/40 font-semibold tracking-wider">{role}</span>
      </div>
      <div className="relative z-10 px-6 py-4 text-center">
        <p className="text-[16px] md:text-[20px] font-extrabold text-white leading-snug tracking-wide uppercase select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          {parts.map((part, i) => {
            const isKey = i % 2 === 1;
            return isKey
              ? <span key={i} className="transition-all duration-200 inline-block px-1 rounded bg-[#E5F91B]/10" style={{ color: '#E5F91B', textShadow: `0 0 12px rgba(229,249,27,0.6)` }}>{part}</span>
              : <span key={i}>{part}</span>;
          })}
        </p>
      </div>
      <div className="h-[3px] bg-white/5 overflow-hidden"><div key={lineKey} className="h-full" style={{ backgroundColor: c, animation: 'subtitleFill 15s linear forwards' }} /></div>
    </div>
  );
}

// Custom hook to read live audio volumes from AnalyserNode
function useAudioVolume(speaking: boolean) {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (!speaking) {
      setVolume(0);
      return;
    }

    let active = true;
    let animId = 0;

    const analyser = getAudioAnalyser();
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const update = () => {
      if (!active) return;
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      const count = dataArray.length;
      for (let i = 0; i < count; i++) {
        sum += dataArray[i];
      }
      const avg = sum / count;
      
      const norm = Math.min(1, avg / 128);
      setVolume(norm);

      animId = requestAnimationFrame(update);
    };

    update();

    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, [speaking]);

  return volume;
}

/* ═══════════ PERSON ═══════════ */
function Person({ img, name, role, speaking, dim, color }:{ img: string; name: string; role: string; speaking: boolean; dim: boolean; color: 'blue' | 'purple' }) {
  const volume = useAudioVolume(speaking);
  const c = color === 'blue' ? '#0071E3' : '#A550DE';
  const initials = name.split(' ').map(n => n[0]).join('');
  const sh = speaking ? `0 12px 36px ${c}30, 0 4px 15px rgba(0,0,0,0.5)` : '0 1px 6px rgba(0,0,0,0.3)';
  
  return (
    <div className={`flex flex-col items-center transition-all duration-500 ease-out ${dim ? 'scale-[0.92] opacity-30' : speaking ? 'scale-[1.03]' : 'opacity-75'}`}>
      <div className="relative">
        {speaking && (
          <>
            {/* Outer expanding ripple */}
            <div 
              className="absolute -inset-3 rounded-[24px] pointer-events-none transition-transform duration-75 ease-out"
              style={{ 
                border: `1.5px solid ${c}`, 
                opacity: Math.max(0.1, 0.6 - volume * 0.5),
                transform: `scale(${1 + volume * 0.15})`,
                boxShadow: `0 0 ${15 + volume * 35}px ${c}30`
              }}
            />
            {/* Inner secondary ripple */}
            <div 
              className="absolute -inset-2 rounded-[22px] pointer-events-none transition-transform duration-75 ease-out"
              style={{ 
                border: `1px solid ${c}50`, 
                opacity: Math.max(0.2, 0.8 - volume * 0.4),
                transform: `scale(${1 + volume * 0.08})`,
              }}
            />
          </>
        )}
        <div className="relative overflow-hidden transition-all duration-400" style={{ width: 'clamp(130px,16vw,210px)', height: 'clamp(170px,22vw,290px)', borderRadius: '18px', background: 'rgba(15, 15, 20, 0.7)', backdropFilter: 'blur(20px)', boxShadow: sh, border: speaking ? `2.5px solid ${c}` : '1px solid rgba(255, 255, 255, 0.08)' }}>
          <img src={img} alt={name} className="absolute inset-0 w-full h-full object-cover object-top" draggable={false} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div className="absolute inset-0 -z-[1]" style={{ background: `linear-gradient(170deg, rgba(20,20,25,0.8), ${c}10, rgba(10,10,12,0.9))` }}>
            <svg viewBox="0 0 100 150" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMax slice"><ellipse cx="50" cy="52" rx="18" ry="22" fill={`${c}15`} /><ellipse cx="50" cy="130" rx="30" ry="36" fill={`${c}08`} /></svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-4xl font-semibold" style={{ color: `${c}30` }}>{initials}</span></div>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-[30%] bg-gradient-to-t from-black/80 to-transparent" />
          
          {/* Audio reactive EQ waveform indicator at the bottom */}
          {speaking && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-[3px] h-8 justify-center">
              {Array.from({ length: 9 }).map((_, i) => {
                const factor = 1 - Math.abs(i - 4) * 0.18; // center bars taller
                const heightVal = Math.max(4, volume * 28 * factor + (Math.sin(Date.now() * 0.01 + i) * 3));
                return (
                  <div 
                    key={i} 
                    className="rounded-full origin-bottom transition-all duration-75" 
                    style={{
                      width: '2.5px',
                      height: `${heightVal}px`,
                      backgroundColor: c,
                      boxShadow: `0 0 4px ${c}50`
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 text-center"><p className="text-[9px] font-semibold tracking-[0.15em] uppercase" style={{ color: c }}>{role}</p><p className="text-[13px] font-semibold text-white/90 mt-[1px]">{name}</p></div>
    </div>
  );
}

/* ═══════════ INTRO ═══════════ */
function Intro() {
  const [p, setP] = useState(0);
  useEffect(() => { const t = [setTimeout(() => setP(1), 300), setTimeout(() => setP(2), 1000), setTimeout(() => setP(3), 2000), setTimeout(() => setP(4), 3200), setTimeout(() => setP(5), 4200)]; return () => t.forEach(clearTimeout) }, []);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: '#08080A' }}>
      <div className="absolute w-[500px] h-[500px] rounded-full transition-all duration-[1500ms]" style={{ opacity: p >= 1 ? 0.5 : 0, transform: `scale(${p >= 1 ? 1 : 0.3})`, background: 'radial-gradient(circle, rgba(0,113,227,0.12) 0%, rgba(165,80,222,0.08) 50%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="relative z-10 text-center animate-fade-in">
        <div className={`mx-auto mb-5 w-14 h-14 transition-all duration-700 ${p >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <svg viewBox="0 0 56 56"><defs><linearGradient id="eG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0071E3" /><stop offset="100%" stopColor="#A550DE" /></linearGradient></defs>
            <rect x="6" y="22" width="44" height="28" rx="5" fill="none" stroke="url(#eG)" strokeWidth="2.5" /><path d="M16 22V16a12 12 0 0 1 24 0v6" fill="none" stroke="url(#eG)" strokeWidth="2.5" strokeLinecap="round" /><circle cx="28" cy="34" r="4" fill="url(#eG)" /><line x1="28" y1="38" x2="28" y2="42" stroke="url(#eG)" strokeWidth="2" strokeLinecap="round" /></svg>
        </div>
        <h1 className={`transition-all duration-[800ms] ${p >= 2 ? 'opacity-100' : 'opacity-0 translate-y-3'}`} style={{ fontSize: 'clamp(26px,5vw,48px)', fontWeight: 600, letterSpacing: '-0.02em', color: '#FFFFFF' }}>The Hidden Vault</h1>
        <div className="mx-auto mt-3 h-[1.5px] rounded-full transition-all duration-700" style={{ width: p >= 3 ? '100px' : '0px', background: 'linear-gradient(90deg, #0071E3, #A550DE)' }} />
        <p className={`mt-3 text-[12px] font-medium tracking-[0.15em] text-white/50 transition-all duration-600 ${p >= 3 ? 'opacity-100' : 'opacity-0'}`}>BROADCAST NETWORK</p>
        <div className={`mt-7 flex items-center justify-center gap-2 transition-all duration-500 ${p >= 5 ? 'opacity-100' : 'opacity-0'}`}><span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse" /><span className="text-[11px] font-medium text-[#FF3B30]">Going Live</span></div>
      </div>
    </div>
  );
}

/* ═══════════ HEADER ═══════════ */
function Header({ live, title }:{ live: boolean; title?: string }) {
  const [now, setNow] = useState(new Date());
  const { episodeNumber, supportersCount, totalTipsUSD, showMonetizationHub, setMonetizationHubOpen } = useBroadcastStore();
  const [viewers, setViewers] = useState(14200);

  useEffect(() => {
    if (!live) return;
    const interval = setInterval(() => {
      setViewers(v => {
        const delta = Math.floor((Math.random() - 0.5) * 300);
        return Math.max(12400, Math.min(15800, v + delta));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [live]);

  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i) }, []);

  return (
    <div className="relative z-30 flex items-center justify-between px-5 h-14 border-b border-white/[0.04] bg-black/20 backdrop-blur-md">
      {/* Left stats column */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {live ? (
          <>
            <div className="flex items-center gap-[5px] bg-[#FF3B30] rounded-full pl-2 pr-2.5 py-[3px] shadow-sm shadow-red-500/30 flex-shrink-0">
              <span className="w-[5px] h-[5px] rounded-full bg-white animate-pulse" />
              <span className="text-[9px] font-semibold tracking-wider text-white font-mono">LIVE</span>
            </div>
            <div className="flex items-center gap-[3px] bg-red-500/10 text-[#FF3B30] rounded-full px-2.5 py-[3px] border border-[#FF3B30]/20 animate-pulse flex-shrink-0">
              <span className="text-[9px] font-bold font-mono tabular-nums">{viewers.toLocaleString()}</span>
              <span className="text-[8px] font-semibold text-[#FF3B30]/80">VIEWERS</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-[5px] bg-white/5 rounded-full pl-2 pr-2.5 py-[3px] border border-white/10 flex-shrink-0">
            <span className="w-[5px] h-[5px] rounded-full bg-white/20" />
            <span className="text-[9px] font-medium tracking-wider text-white/40">Standby</span>
          </div>
        )}
        <div className="flex items-center gap-[4px] bg-white/5 backdrop-blur-md rounded-full px-2.5 py-[3px] border border-white/5 flex-shrink-0">
          <span className="text-[8px] font-bold text-[#0071E3]">EP {episodeNumber}</span>
        </div>
        <div className="flex items-center gap-[4px] bg-amber-500/10 text-amber-400 rounded-full px-2.5 py-[3px] border border-amber-500/20 text-[8.5px] font-bold tracking-wider font-mono flex-shrink-0">
          <span>⚡ {supportersCount} SUPPORTERS</span>
          <span className="text-white/30">|</span>
          <span>${totalTipsUSD.toLocaleString()}</span>
        </div>
      </div>

      {/* Middle episode title (hidden on small viewports to prevent squishing) */}
      {title && (
        <div className="text-center px-4 max-w-[34%] flex-shrink-0 hidden md:block">
          <p className="text-[7px] font-semibold tracking-[0.2em] text-white/40 uppercase mb-[1px]">Tonight</p>
          <p className="text-[12px] font-semibold text-white/95 truncate">{title}</p>
        </div>
      )}

      {/* Right controls column */}
      <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
        <p className="text-[9px] text-white/60 font-mono tabular-nums flex-shrink-0">{now.toLocaleTimeString('en-GB')}</p>
        <div className="h-3 w-px bg-white/10 flex-shrink-0" />
        <button
          onClick={() => setMonetizationHubOpen(!showMonetizationHub)}
          className={`flex items-center gap-1.5 px-3 py-1 text-[9px] font-bold tracking-wider cursor-pointer transition-all duration-300 border rounded-md flex-shrink-0 ${
            showMonetizationHub
              ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-extrabold'
              : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30 hover:border-amber-400/60 hover:shadow-[0_0_10px_rgba(245,158,11,0.2)] font-bold'
          }`}
        >
          <span>VAULT HUB</span>
          <span className="animate-pulse">⚡</span>
        </button>
        <div className="h-3 w-px bg-white/10 flex-shrink-0" />
        <div className="flex items-center gap-2 px-2.5 py-[5px] rounded-lg flex-shrink-0 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-[#0071E3] to-[#A550DE] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </div>
          <span className="text-[9px] font-semibold text-white/80 leading-none tracking-wide">The Hidden Vault</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ TICKER ═══════════ */
function Ticker({ items }:{ items: string[] }) {
  const j = useMemo(() => [...items, ...items, ...items].join('     ·     '), [items]);
  return (
    <div className="absolute bottom-0 inset-x-0 z-30 h-[32px] flex items-center border-t border-white/[0.05]" style={{ background: 'linear-gradient(180deg, rgba(10, 10, 12, 0.85), rgba(5, 5, 8, 0.95))' }}>
      <div className="flex-shrink-0 h-full flex">
        <div className="h-full px-2 flex items-center gap-[3px]" style={{ background: 'linear-gradient(135deg, #0071E3, #5856D6)' }}><span className="w-[4px] h-[4px] rounded-full bg-white animate-pulse" /><span className="text-[8px] font-semibold tracking-wider text-white">LIVE</span></div>
        <div className="h-full px-2 flex items-center bg-white/[0.02] border-r border-white/5"><span className="text-[8px] font-medium text-white/50">Updates</span></div>
      </div>
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#08080A] to-transparent z-10" /><div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#08080A] to-transparent z-10" />
        <div className="ticker-track"><span className="text-[10px] text-white/50 tracking-wide whitespace-nowrap px-3">{j}</span><span className="text-[10px] text-white/50 tracking-wide whitespace-nowrap px-3">{j}</span></div>
      </div>
    </div>
  );
}

/* ═══════════ UP NEXT SCREEN ═══════════ */
function UpNextScreen({ episodeNumber }:{ episodeNumber: number }) {
  const [countdown, setCountdown] = useState(8);
  const nextTopic = useMemo(() => {
    const topics = ['The Simulation Hypothesis', 'Quantum Consciousness', 'The Dark Forest Theory', 'CRISPR Gene Editing', 'Digital Surveillance State', 'Ancient Advanced Civilizations', 'Artificial General Intelligence', 'Neuralink and The Merge'];
    return topics[Math.floor(Math.random() * topics.length)];
  }, []);

  useEffect(() => {
    const i = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: '#08080A' }}>
      <AnimatedBG speaker={null} playing={false} segColor="#0071E3" />
      <Particles />
      <div className="relative z-10 text-center max-w-md px-6 animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-[#34C759]/10 rounded-full px-4 py-1.5 mb-5 border border-[#34C759]/20">
          <span className="text-[10px] text-[#34C759]">✓</span>
          <span className="text-[11px] font-semibold text-[#34C759]">Episode {episodeNumber} Complete</span>
        </div>

        <p className="text-[10px] font-medium tracking-[0.25em] text-white/40 uppercase mb-2">Up Next</p>
        <h2 className="text-[22px] font-semibold text-white leading-tight mb-4">{nextTopic}</h2>

        <div className="w-16 h-16 mx-auto mb-4 relative">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="url(#upG)" strokeWidth="3"
              strokeDasharray={`${(countdown / 8) * 176} 176`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s linear' }} />
            <defs><linearGradient id="upG"><stop offset="0%" stopColor="#0071E3" /><stop offset="100%" stopColor="#A550DE" /></linearGradient></defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[20px] font-bold text-white tabular-nums">{countdown}</span>
          </div>
        </div>

        <p className="text-[11px] text-white/50">Starting automatically…</p>

        <div className="mt-6 flex items-center justify-center gap-2 opacity-30">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="text-[11px] font-medium text-white">The Hidden Vault</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ IDLE ═══════════ */
function Idle() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: '#08080A' }}>
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto mb-3">
          <div className="absolute inset-0 rounded-full border border-[#0071E3]/20" style={{ animation: 'ringOut 3s ease-out infinite' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="url(#iG2)" strokeWidth="1.5" strokeLinecap="round">
              <defs>
                <linearGradient id="iG2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0071E3" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#A550DE" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>
        <h2 className="text-[16px] font-bold text-white/20 tracking-wider">The Hidden Vault</h2>
        <p className="text-[10px] text-white/50 mt-3">Initializing broadcast engine…</p>
        <div className="w-6 h-6 mx-auto mt-3">
          <svg className="w-full h-full spin-smooth" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
            <circle cx="12" cy="12" r="9" fill="none" stroke="url(#iG2)" strokeWidth="2" strokeDasharray="28 56" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ PRESET MERCH LIST ═══════════ */
const merchItems = [
  {
    id: 'hoodie',
    name: 'Vault Cyber Hoodie',
    price: 65,
    image: '/images/vault_hoodie.png',
    description: 'Ultra-heavy weave, thermal lining, embroidered vector wave. Low-visibility stealth fit.'
  },
  {
    id: 'dossier',
    name: 'Vault Confidential Dossier',
    price: 35,
    image: '/images/vault_dossier.png',
    description: 'Physical stamped blue manila folder with classified files, secret schematic cards, and iron-on patches.'
  },
  {
    id: 'cap',
    name: 'Vault Tactical Cap',
    price: 25,
    image: '/images/vault_cap.png',
    description: 'Ripstop tactical cap, mesh side panels, velcro hook/loop back strap, embroidered emblem.'
  }
];

const presets = [
  { name: 'Bronze Core 💿', value: '5' },
  { name: 'Silver Dossier 📁', value: '15' },
  { name: 'Gold Key 🔑', value: '50' }
];

/* ═══════════ MONETIZATION HUB DRAWER ═══════════ */
function MonetizationHub({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'sponsor' | 'tipping' | 'merch'>('sponsor');
  
  // States for mock transactions
  const [txState, setTxState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [txLogs, setTxLogs] = useState<string[]>([]);
  const [txType, setTxType] = useState<'sponsor' | 'tip' | 'merch' | null>(null);
  
  // Store values/actions
  const queueSponsoredTopic = useBroadcastStore(s => s.queueSponsoredTopic);
  const addTip = useBroadcastStore(s => s.addTip);
  const triggerReaction = useBroadcastStore(s => s.triggerReaction);
  const addChatMessage = useBroadcastStore(s => s.addChatMessage);
  const monetizationTrigger = useBroadcastStore(s => s.monetizationTrigger);
  const clearMonetizationTrigger = useBroadcastStore(s => s.clearMonetizationTrigger);
  const setMonetizationHubOpen = useBroadcastStore(s => s.setMonetizationHubOpen);
  
  // Form values
  // Sponsor form
  const [sponsorTopic, setSponsorTopic] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  
  // Tipping form
  const [tipAmount, setTipAmount] = useState('15');
  const [tipperName, setTipperName] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('Silver Dossier 📁');
  const [selectedWallet, setSelectedWallet] = useState('Phantom Vault');
  
  // Merch form
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingEmail, setShippingEmail] = useState('');

  // Transaction details for receipt
  const [receiptDetails, setReceiptDetails] = useState<any>(null);

  // Run Mock Transaction logic
  const runMockTx = useCallback((
    type: 'sponsor' | 'tip' | 'merch',
    onComplete: () => void,
    logSteps: string[]
  ) => {
    setTxType(type);
    setTxState('processing');
    setTxLogs([]);
    
    let currentStep = 0;
    const intervalTime = 900; // Step every 900ms (~6.3s total)
    
    // Add first log immediately
    setTxLogs([`[0.0s] ${logSteps[0]}`]);
    
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < logSteps.length) {
        setTxLogs(prev => [...prev, `[${(currentStep * 1.0).toFixed(1)}s] ${logSteps[currentStep]}`]);
      } else {
        clearInterval(interval);
        setTxState('success');
        onComplete();
      }
    }, intervalTime);
  }, []);

  // Programmatic execution mocks
  const executeSponsorMock = useCallback((topic: string, name: string) => {
    const steps = [
      'Connecting to ZK-payment ledger gateway...',
      'Opening priority topic registration slot...',
      'Escrowing $25.00 USD via anonymous coinjoin...',
      'Generating zero-knowledge priority slot proof...',
      `Serializing topic metadata: "${topic}"...`,
      'Broadcasting queue payload to host autopilot node...',
      'Queue sequence confirmed. Priority index: 1.'
    ];
    
    runMockTx('sponsor', () => {
      queueSponsoredTopic(topic, name);
      triggerReaction('💰');
      setReceiptDetails({
        id: `TX-${Math.floor(Math.random() * 900000 + 100000)}`,
        hash: '0x' + Array.from({ length: 40 }).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        timestamp: new Date().toISOString(),
        type: 'Sponsorship Queue',
        amount: '$25.00 USD',
        meta: `Topic: "${topic}" | Sponsor: @${name}`
      });
      setSponsorTopic('');
    }, steps);
  }, [runMockTx, queueSponsoredTopic, triggerReaction]);

  const executeTipMock = useCallback((amount: number, name: string, badge: string, wallet: string) => {
    const steps = [
      'Establishing privacy-shielded client handshake...',
      `Ring-signing tip payload ($${amount.toFixed(2)} USD)...`,
      'Routing through multi-hop onion gateway...',
      `Authenticating zero-knowledge signature with ${wallet}...`,
      'Broadcasting encrypted transaction packet to mempool...',
      'Ledger balance entry verified on decentralized vault core.',
      'ZK-Tip transaction verified.'
    ];
    
    runMockTx('tip', () => {
      addTip(amount, name, badge);
      triggerReaction(amount >= 50 ? '👑' : amount >= 15 ? '💎' : '💰');
      setReceiptDetails({
        id: `TX-${Math.floor(Math.random() * 900000 + 100000)}`,
        hash: '0x' + Array.from({ length: 40 }).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        timestamp: new Date().toISOString(),
        type: `Supporter Tip (${badge})`,
        amount: `$${amount.toFixed(2)} USD`,
        meta: `Tipper: @${name} | Wallet: ${wallet}`
      });
    }, steps);
  }, [runMockTx, addTip, triggerReaction]);

  const executeMerchMock = useCallback((itemKey: string, name: string, address: string, email: string) => {
    const product = merchItems.find(i => i.id === itemKey);
    if (!product) return;
    
    const steps = [
      'Opening confidential drop supply terminal...',
      `Reserving stock slot for item: ${product.name}...`,
      'Encrypting customer shipping coordinates using AES-256...',
      'Generating anonymous delivery routing manifest...',
      `Authorizing transaction amount $${product.price.toFixed(2)} USD...`,
      'Routing to local warehouse drone distribution center...',
      'Confidential invoice generated! Order dispatched.'
    ];
    
    runMockTx('merch', () => {
      addTip(product.price, name, `Bought ${product.name}`);
      addChatMessage({
        user: 'SYSTEM',
        text: `🛍️ @${name} purchased a ${product.name}! Order shipped.`,
        avatarColor: '#34C759',
        isSystem: true
      });
      triggerReaction('🛍️');
      setReceiptDetails({
        id: `ORD-${Math.floor(Math.random() * 900000 + 100000)}`,
        hash: '0x' + Array.from({ length: 40 }).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        timestamp: new Date().toISOString(),
        type: `Merch Checkout - ${product.name}`,
        amount: `$${product.price.toFixed(2)} USD`,
        meta: `Customer: ${name} | Email: ${email} | Shipping: ${address}`
      });
      setSelectedProduct(null);
      setShippingName('');
      setShippingAddress('');
      setShippingEmail('');
    }, steps);
  }, [runMockTx, addTip, addChatMessage, triggerReaction]);

  // Form handlers calling core execution functions
  const handleSponsorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorTopic.trim() || !sponsorName.trim()) return;
    executeSponsorMock(sponsorTopic.trim(), sponsorName.trim());
  };

  const handleTipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipAmount || parseFloat(tipAmount) <= 0 || !tipperName.trim()) return;
    executeTipMock(parseFloat(tipAmount), tipperName.trim(), selectedBadge, selectedWallet);
  };

  const handleMerchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !shippingName.trim() || !shippingAddress.trim() || !shippingEmail.trim()) return;
    executeMerchMock(selectedProduct.id, shippingName.trim(), shippingAddress.trim(), shippingEmail.trim());
  };

  // Automation logic matching monetizationTrigger
  useEffect(() => {
    if (!monetizationTrigger) return;

    const trigger = monetizationTrigger;
    // Clear trigger immediately to avoid loops
    clearMonetizationTrigger();

    // 1. Open drawer
    setMonetizationHubOpen(true);

    // 2. Pre-fill forms & trigger after a 1.2s physical delay to let viewer see actions
    if (trigger.type === 'sponsor') {
      setActiveTab('sponsor');
      setSponsorTopic(trigger.data.topic);
      setSponsorName(trigger.data.user);

      const timer = setTimeout(() => {
        executeSponsorMock(trigger.data.topic, trigger.data.user);
      }, 1200);
      return () => clearTimeout(timer);
    }

    if (trigger.type === 'tip') {
      setActiveTab('tipping');
      const amount = trigger.data.amount;
      const user = trigger.data.user;

      setTipAmount(String(amount));
      setTipperName(user);

      let badge = 'Silver Dossier 📁';
      if (amount >= 50) badge = 'Gold Key 🔑';
      else if (amount < 15) badge = 'Bronze Core 💿';
      setSelectedBadge(badge);

      const wallet = ['Phantom Vault', 'MetaMask Privacy Shield', 'Secret Ledger'][Math.floor(Math.random() * 3)];
      setSelectedWallet(wallet);

      const timer = setTimeout(() => {
        executeTipMock(amount, user, badge, wallet);
      }, 1200);
      return () => clearTimeout(timer);
    }

    if (trigger.type === 'merch') {
      setActiveTab('merch');
      const product = merchItems.find(item => item.id === trigger.data.item);
      if (product) {
        setSelectedProduct(product);
        setShippingName(trigger.data.user);
        const addr = '128 Secure Way, Cyber Sec';
        const mail = `${trigger.data.user}@vaultmail.io`;
        setShippingAddress(addr);
        setShippingEmail(mail);

        const timer = setTimeout(() => {
          executeMerchMock(trigger.data.item, trigger.data.user, addr, mail);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [
    monetizationTrigger,
    clearMonetizationTrigger,
    setMonetizationHubOpen,
    executeSponsorMock,
    executeTipMock,
    executeMerchMock
  ]);

  // Auto-close on success after 4 seconds
  useEffect(() => {
    if (txState === 'success') {
      const timer = setTimeout(() => {
        setTxState('idle');
        setReceiptDetails(null);
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [txState, onClose]);

  return (
    <div
      className={`fixed top-[56px] bottom-[32px] right-0 w-[380px] bg-black/90 border-l border-white/10 backdrop-blur-2xl z-40 flex flex-col transition-transform duration-300 ease-out transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-500 animate-pulse" />
          <div className="text-left">
            <h2 className="text-[12px] font-bold text-white uppercase tracking-wider leading-none">Vault Secure Hub</h2>
            <span className="text-[8px] font-bold text-emerald-400 font-mono tracking-widest block mt-1 uppercase">
              STATUS: ENCRYPTED // ZK-PROOF ENABLED
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {txState === 'processing' ? (
        /* Console log animation overlay */
        <div className="flex-1 flex flex-col bg-black p-5 font-mono text-left overflow-hidden">
          <div className="flex items-center gap-2.5 text-amber-500 mb-4 animate-pulse">
            <Flame className="w-5 h-5 animate-spin text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Processing ZK-{txType} Transaction...</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 text-[10px] text-green-400 font-mono select-text bg-black/50 border border-green-500/20 rounded-xl p-3.5 leading-relaxed shadow-inner">
            {txLogs.map((log, i) => (
              <div key={i} className="animate-fade-in">
                <span className="text-white/40 font-semibold">{`>> `}</span>
                {log}
              </div>
            ))}
            <div className="w-1.5 h-3.5 bg-green-400 animate-pulse inline-block align-middle ml-1" />
          </div>
          <div className="mt-4 text-center">
            <p className="text-[9px] text-white/40 uppercase tracking-widest">Do not close panel. Verification in progress.</p>
          </div>
        </div>
      ) : txState === 'success' && receiptDetails ? (
        /* Success Receipt overlay */
        <div className="flex-1 flex flex-col p-5 overflow-y-auto text-left justify-between bg-zinc-950">
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center py-4 border-b border-white/10">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
              <h3 className="text-sm font-bold text-white tracking-widest uppercase">Transaction Confirmed</h3>
              <p className="text-[9px] text-emerald-400 font-mono mt-1">{receiptDetails.id}</p>
            </div>
            
            <div className="space-y-3 pt-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-white/50">Type:</span>
                <span className="text-white font-medium">{receiptDetails.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Amount Paid:</span>
                <span className="text-amber-400 font-bold font-mono">{receiptDetails.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Timestamp:</span>
                <span className="text-white/80 font-mono text-[9.5px]">
                  {new Date(receiptDetails.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="border-t border-white/5 pt-3 space-y-1.5">
                <span className="text-white/50 block">Transaction Hash (ZK-Proof):</span>
                <p className="text-[9px] text-white/40 font-mono bg-black/60 border border-white/10 rounded px-2 py-1.5 break-all select-all select-none">
                  {receiptDetails.hash}
                </p>
              </div>
              {receiptDetails.meta && (
                <div className="border-t border-white/5 pt-3">
                  <span className="text-white/50 block">Metadata:</span>
                  <p className="text-[10px] text-white/70 italic mt-1 leading-snug">
                    {receiptDetails.meta}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => {
              setTxState('idle');
              setReceiptDetails(null);
            }}
            className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer text-center uppercase tracking-wider"
          >
            Return to Vault Hub
          </button>
        </div>
      ) : selectedProduct ? (
        /* Merch Shipping checkout panel */
        <div className="flex-1 flex flex-col p-5 overflow-y-auto text-left justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-12 h-12 rounded-lg object-cover border border-white/10 bg-white/5 flex-shrink-0"
              />
              <div>
                <h3 className="text-xs font-bold text-white leading-tight">{selectedProduct.name}</h3>
                <span className="text-amber-400 font-bold text-xs mt-1 block">${selectedProduct.price.toFixed(2)}</span>
              </div>
            </div>
            
            <form onSubmit={handleMerchSubmit} className="space-y-3 pt-1">
              <h4 className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Confidential Delivery Details</h4>
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Receiver Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Blackwell"
                  value={shippingName}
                  onChange={e => setShippingName(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Delivery Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101 Blackwood St, Sector 7"
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Anonymized Contact Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@vaultmail.io"
                  value={shippingEmail}
                  onChange={e => setShippingEmail(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>
              
              <div className="pt-4 space-y-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer text-center uppercase tracking-wider"
                >
                  Submit Order // Secure Checkout
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="w-full border border-white/10 hover:bg-white/5 text-white text-xs font-bold py-3 rounded-xl transition-all cursor-pointer text-center uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Normal Hub View */
        <>
          {/* Tabs */}
          <div className="flex border-b border-white/10 bg-white/[0.01]">
            <button
              onClick={() => setActiveTab('sponsor')}
              className={`flex-1 py-3 text-[10px] font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeTab === 'sponsor'
                  ? 'border-amber-500 text-amber-400 bg-white/[0.02]'
                  : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.005]'
              }`}
            >
              ⚡ Sponsor
            </button>
            <button
              onClick={() => setActiveTab('tipping')}
              className={`flex-1 py-3 text-[10px] font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeTab === 'tipping'
                  ? 'border-amber-500 text-amber-400 bg-white/[0.02]'
                  : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.005]'
              }`}
            >
              💎 Tipping
            </button>
            <button
              onClick={() => setActiveTab('merch')}
              className={`flex-1 py-3 text-[10px] font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeTab === 'merch'
                  ? 'border-amber-500 text-amber-400 bg-white/[0.02]'
                  : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.005]'
              }`}
            >
              🛍️ Merch
            </button>
          </div>

          {/* Tab Panels */}
          <div className="flex-1 overflow-y-auto p-5 text-left">
            {activeTab === 'sponsor' && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-[11px] text-white/70 leading-relaxed shadow-sm">
                  <p className="font-bold text-white text-xs mb-1.5">Autopilot Topic Insertion</p>
                  Sponsor a specific investigation topic. Our autonomous engine processes the prompt in the background and queues it into the autoplay cycle immediately following the current broadcast.
                </div>
                
                <form onSubmit={handleSponsorSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">Topic Name</label>
                    <input
                      type="text"
                      maxLength={60}
                      required
                      placeholder="e.g. The Secret Base in Antarctica"
                      value={sponsorTopic}
                      onChange={e => setSponsorTopic(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 focus:border-amber-500/50 rounded-lg px-3 py-2.5 text-xs text-white outline-none font-medium placeholder-white/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">Sponsor Handle</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. cyber_recon"
                      value={sponsorName}
                      onChange={e => setSponsorName(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 focus:border-amber-500/50 rounded-lg px-3 py-2.5 text-xs text-white outline-none font-medium placeholder-white/20"
                    />
                  </div>
                  
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-white/40 uppercase font-bold tracking-wider">Required Deposit</span>
                    <span className="text-amber-400 font-extrabold text-sm font-mono">$25.00 USD // 0.0075 ETH</span>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-400/20 active:scale-98 cursor-pointer text-center uppercase tracking-wider"
                  >
                    Authorize Topic Slot
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'tipping' && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-[11px] text-white/70 leading-relaxed shadow-sm">
                  <p className="font-bold text-white text-xs mb-1.5">Support Broadcaster Core</p>
                  Send a privacy-shielded cryptocurrency tip to fuel deep-dive operations. Trigger live chat alerts, viewer leaderboards, and interactive stream reactions.
                </div>
                
                <form onSubmit={handleTipSubmit} className="space-y-4">
                  {/* Preset Badges Grid */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">Select Supporter Badge</label>
                    <div className="grid grid-cols-3 gap-2">
                      {presets.map(p => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => {
                            setTipAmount(p.value);
                            setSelectedBadge(p.name);
                          }}
                          className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            selectedBadge === p.name && tipAmount === p.value
                              ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                              : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          <span className="text-[10px] font-bold text-center leading-tight whitespace-nowrap">{p.name}</span>
                          <span className="text-[11px] font-mono font-bold">${p.value}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Amount / Username inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">Custom Tip ($)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="15"
                        value={tipAmount}
                        onChange={e => {
                          setTipAmount(e.target.value);
                          if (e.target.value === '5') setSelectedBadge('Bronze Core 💿');
                          else if (e.target.value === '15') setSelectedBadge('Silver Dossier 📁');
                          else if (e.target.value === '50') setSelectedBadge('Gold Key 🔑');
                          else setSelectedBadge('Custom Badge');
                        }}
                        className="w-full bg-white/[0.02] border border-white/10 focus:border-amber-500/50 rounded-lg px-3 py-2.5 text-xs text-white outline-none font-medium placeholder-white/20 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">Tipper Handle</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. pixel_pioneer"
                        value={tipperName}
                        onChange={e => setTipperName(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/10 focus:border-amber-500/50 rounded-lg px-3 py-2.5 text-xs text-white outline-none font-medium placeholder-white/20"
                      />
                    </div>
                  </div>
                  
                  {/* Wallet Client selector */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">ZK-Wallet Provider</label>
                    <div className="flex gap-2">
                      {['Phantom Vault', 'MetaMask Privacy Shield', 'Secret Ledger'].map(w => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSelectedWallet(w)}
                          className={`flex-1 border rounded-lg py-2 text-[10px] font-bold text-center tracking-wide transition-all cursor-pointer ${
                            selectedWallet === w
                              ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                              : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                          }`}
                        >
                          {w.replace(' Vault', '').replace(' Shield', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-400/20 active:scale-98 cursor-pointer text-center uppercase tracking-wider"
                  >
                    Initiate Secure Tip
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'merch' && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-[11px] text-white/70 leading-relaxed shadow-sm">
                  <p className="font-bold text-white text-xs mb-1.5">Classified Drop Goods</p>
                  Deploy branded physical assets to support research initiatives. All packages are shipped anonymously with randomized origin hubs.
                </div>
                
                {/* Store Items List */}
                <div className="space-y-3.5 pt-1">
                  {merchItems.map(item => (
                    <div
                      key={item.id}
                      className="border border-white/10 hover:border-white/20 rounded-2xl p-3 bg-white/[0.01] transition-all flex gap-3.5 items-start"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover border border-white/10 bg-white/5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-baseline gap-2">
                          <h3 className="text-xs font-bold text-white leading-tight truncate">{item.name}</h3>
                          <span className="text-amber-400 font-bold font-mono text-xs flex-shrink-0">${item.price}</span>
                        </div>
                        <p className="text-[10px] text-white/50 leading-normal mt-1 mb-2.5">
                          {item.description}
                        </p>
                        <button
                          onClick={() => setSelectedProduct(item)}
                          className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 rounded-lg text-[9px] tracking-wider uppercase transition-colors cursor-pointer"
                        >
                          Confidential Order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
