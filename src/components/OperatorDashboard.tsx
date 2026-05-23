import { useState, useEffect, useRef } from 'react';
import { useBroadcastStore } from '../store/broadcastStore';


/* ═══════════ SECTION HEADER ═══════════ */
function SectionHeader({ icon, title, badge }: { icon: string; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-sm">{icon}</span>
      <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">{title}</span>
      {badge && (
        <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,113,227,0.2)', color: '#0071E3', border: '1px solid rgba(0,113,227,0.3)' }}>
          {badge}
        </span>
      )}
    </div>
  );
}

/* ═══════════ MASKED INPUT ═══════════ */
function MaskedInput({ label, value, onChange, placeholder, mono = false }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; mono?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-2">
      <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-wider mb-1">{label}</label>
      <div className="flex gap-1">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg px-3 py-1.5 text-[11px] outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontFamily: mono ? 'monospace' : 'inherit',
          }}
        />
        <button
          onClick={() => setShow(s => !s)}
          className="px-2 rounded-lg text-white/30 hover:text-white/70 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {show ? '🙈' : '👁'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════ TEXT INPUT ═══════════ */
function TextInput({ label, value, onChange, placeholder, mono = false }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; mono?: boolean }) {
  return (
    <div className="mb-2">
      <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-wider mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-1.5 text-[11px] outline-none"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff',
          fontFamily: mono ? 'monospace' : 'inherit',
        }}
      />
    </div>
  );
}

/* ═══════════ STATUS BADGE ═══════════ */
function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: active ? '#34C759' : '#636366', boxShadow: active ? '0 0 6px #34C759' : 'none', animation: active ? 'pulse 2s infinite' : 'none' }} />
      <span className="text-[10px] font-mono" style={{ color: active ? '#34C759' : '#636366' }}>{active ? label : 'OFFLINE'}</span>
    </div>
  );
}

/* ═══════════ OPERATOR DASHBOARD ═══════════ */
export function OperatorDashboard() {
  const {
    geminiApiKey, setGeminiApiKey,
    groqApiKey, setGroqApiKey,
    youtubeVideoId, setYoutubeVideoId,
    rtmpUrl, setRtmpUrl,
    streamKey, setStreamKey,
    youtubeChatActive, setYoutubeChatActive,
    isStreamingDirect, setIsStreamingDirect,
    logs, clearLogs,
    chatMessages,
    addChatMessage,
    addLog,
  } = useBroadcastStore();

  const logsEndRef = useRef<HTMLDivElement>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [manualCmd, setManualCmd] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [streamRuntime, setStreamRuntime] = useState('');
  const [serverConfig, setServerConfig] = useState({
    geminiApiKeyConfigured: false,
    groqApiKeyConfigured: false,
  });

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setServerConfig({
          geminiApiKeyConfigured: !!data.geminiApiKeyConfigured,
          groqApiKeyConfigured: !!data.groqApiKeyConfigured,
        });
      })
      .catch(err => console.warn('Failed to load server config:', err));
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Poll stream status
  useEffect(() => {
    if (!isStreamingDirect) { setStreamRuntime(''); return; }
    const iv = setInterval(async () => {
      try {
        const res = await fetch('/api/stream/status');
        const data = await res.json();
        if (data.runtime_seconds) {
          const h = Math.floor(data.runtime_seconds / 3600);
          const m = Math.floor((data.runtime_seconds % 3600) / 60);
          const s = Math.floor(data.runtime_seconds % 60);
          setStreamRuntime(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
        }
        if (!data.active && isStreamingDirect) {
          setIsStreamingDirect(false);
          addLog('⚠ Stream terminated externally or lost connection.');
        }
      } catch {}
    }, 3000);
    return () => clearInterval(iv);
  }, [isStreamingDirect, setIsStreamingDirect, addLog]);

  // Start / stop stream
  const handleStartStream = async () => {
    if (!rtmpUrl || !streamKey) {
      setStatusMsg('⚠ RTMP URL and Stream Key are required.');
      return;
    }
    setStreamLoading(true);
    setStatusMsg('Initializing headless capture pipeline...');
    try {
      const res = await fetch('/api/stream/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rtmpUrl, streamKey }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsStreamingDirect(true);
        setStatusMsg('✓ Stream established. Broadcasting to YouTube RTMP.');
        addLog('✓ Headless FFmpeg stream started successfully.');
      } else {
        setStatusMsg(`✗ ${data.error || 'Stream start failed'}`);
        addLog(`✗ Stream start failed: ${data.error}`);
      }
    } catch (e: any) {
      setStatusMsg(`✗ Network error: ${e.message}`);
      addLog(`✗ Stream start network error: ${e.message}`);
    } finally {
      setStreamLoading(false);
    }
  };

  const handleStopStream = async () => {
    setStreamLoading(true);
    try {
      await fetch('/api/stream/stop', { method: 'POST' });
      setIsStreamingDirect(false);
      setStatusMsg('Stream stopped.');
      addLog('Stream stopped by operator.');
    } catch {}
    setStreamLoading(false);
  };

  // Start / stop YouTube chat
  const handleStartChat = async () => {
    if (!youtubeVideoId) {
      setStatusMsg('⚠ YouTube Video ID required.');
      return;
    }
    setChatLoading(true);
    try {
      const res = await fetch('/api/youtube-chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: youtubeVideoId }),
      });
      const data = await res.json();
      if (res.ok) {
        setYoutubeChatActive(true);
        addLog(`YouTube Live Chat connected for video: ${youtubeVideoId}`);
      } else {
        setStatusMsg(`✗ ${data.error || 'Chat connect failed'}`);
      }
    } catch (e: any) {
      setStatusMsg(`✗ Chat error: ${e.message}`);
    } finally {
      setChatLoading(false);
    }
  };

  const handleStopChat = async () => {
    try {
      await fetch('/api/youtube-chat/stop', { method: 'POST' });
      setYoutubeChatActive(false);
      addLog('YouTube Live Chat disconnected.');
    } catch {}
  };

  // Inject manual command
  const handleSendCmd = () => {
    if (!manualCmd.trim()) return;
    addChatMessage({ user: 'OPERATOR', text: manualCmd.trim(), avatarColor: '#0071E3', isSystem: true });
    addLog(`Manual command injected: ${manualCmd.trim()}`);
    setManualCmd('');
  };

  // Open stream mode in new tab
  const openStreamPreview = () => {
    window.open('/?stream_mode=true', '_blank');
  };

  const panelStyle: React.CSSProperties = {
    background: 'rgba(10,10,15,0.92)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  };

  return (
    <div
      className="h-full flex flex-col overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg, #080810 0%, #050508 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0071E3, #A550DE)' }}>
            <span className="text-white text-[13px]">⚙</span>
          </div>
          <div>
            <p className="text-[12px] font-bold text-white tracking-wide">OPERATOR CONSOLE</p>
            <p className="text-[8px] text-white/30 font-mono uppercase tracking-widest">Vault Broadcast Engine v2</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge active={isStreamingDirect} label="STREAMING" />
          <StatusBadge active={youtubeChatActive} label="CHAT LIVE" />
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

        {/* ── API Configuration ── */}
        <div style={panelStyle}>
          <SectionHeader icon="🔑" title="AI API Keys" badge="Encrypted" />
          <MaskedInput
            label="Gemini API Key"
            value={geminiApiKey}
            onChange={setGeminiApiKey}
            placeholder={serverConfig.geminiApiKeyConfigured ? "✓ Configured via Server Secrets" : "AIzaSy..."}
            mono
          />
          <MaskedInput
            label="Groq API Key"
            value={groqApiKey}
            onChange={setGroqApiKey}
            placeholder={serverConfig.groqApiKeyConfigured ? "✓ Configured via Server Secrets" : "gsk_..."}
            mono
          />
          {serverConfig.geminiApiKeyConfigured || serverConfig.groqApiKeyConfigured ? (
            <p className="text-[8.5px] text-[#34C759] mt-1 leading-relaxed">
              ✓ Server-side API key detected. You can leave these fields empty unless you want to override them locally.
            </p>
          ) : (
            <p className="text-[8.5px] text-white/25 mt-1 leading-relaxed">
              Keys are stored in browser localStorage or read from Space Secrets on the server.
            </p>
          )}
        </div>

        {/* ── YouTube & RTMP Settings ── */}
        <div style={panelStyle}>
          <SectionHeader icon="📡" title="Stream Configuration" />
          <TextInput label="YouTube Video ID" value={youtubeVideoId} onChange={setYoutubeVideoId} placeholder="dQw4w9WgXcQ" mono />
          <TextInput label="RTMP Server URL" value={rtmpUrl} onChange={setRtmpUrl} placeholder="rtmp://a.rtmp.youtube.com/live2" mono />
          <MaskedInput label="YouTube Stream Key" value={streamKey} onChange={setStreamKey} placeholder="xxxx-xxxx-xxxx-xxxx" mono />
        </div>

        {/* ── Direct Stream Control ── */}
        <div style={panelStyle}>
          <SectionHeader icon="🎬" title="Headless Stream Control" />

          {isStreamingDirect && streamRuntime && (
            <div className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)' }}>
              <span className="w-[6px] h-[6px] rounded-full bg-[#34C759] animate-pulse" />
              <span className="text-[10px] font-mono text-[#34C759]">LIVE · {streamRuntime}</span>
              <span className="ml-auto text-[9px] text-white/40">YouTube RTMP</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={isStreamingDirect ? handleStopStream : handleStartStream}
              disabled={streamLoading}
              className="flex-1 py-2.5 rounded-xl text-[11px] font-bold tracking-wider uppercase transition-all active:scale-95 disabled:opacity-50"
              style={isStreamingDirect
                ? { background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)', color: '#FF3B30' }
                : { background: 'linear-gradient(135deg, #0071E3, #5856D6)', border: 'none', color: '#fff', boxShadow: '0 4px 15px rgba(0,113,227,0.3)' }
              }
            >
              {streamLoading ? '⏳ Processing...' : isStreamingDirect ? '⏹ Stop Stream' : '▶ Start Headless Stream'}
            </button>
            <button
              onClick={openStreamPreview}
              className="px-3 py-2.5 rounded-xl text-[11px] transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
              title="Open stream playout in new tab"
            >
              ↗
            </button>
          </div>

          {statusMsg && (
            <p className="mt-2 text-[9.5px] leading-relaxed" style={{ color: statusMsg.startsWith('✓') ? '#34C759' : statusMsg.startsWith('⚠') ? '#FF9500' : '#FF3B30', fontFamily: 'monospace' }}>
              {statusMsg}
            </p>
          )}
        </div>

        {/* ── YouTube Live Chat ── */}
        <div style={panelStyle}>
          <SectionHeader icon="💬" title="YouTube Live Chat" />
          <div className="flex gap-2 mb-3">
            <button
              onClick={youtubeChatActive ? handleStopChat : handleStartChat}
              disabled={chatLoading}
              className="flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
              style={youtubeChatActive
                ? { background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.25)', color: '#FF3B30' }
                : { background: 'rgba(52,199,89,0.12)', border: '1px solid rgba(52,199,89,0.25)', color: '#34C759' }
              }
            >
              {chatLoading ? '⏳' : youtubeChatActive ? '⏹ Disconnect Chat' : '▶ Connect Chat'}
            </button>
          </div>

          {/* Chat messages */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="h-[120px] overflow-y-auto p-2 space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {chatMessages.length === 0 ? (
                <p className="text-[9px] text-white/20 text-center mt-4">No chat messages yet</p>
              ) : (
                chatMessages.slice(-20).map(m => (
                  <div key={m.id} className="flex items-start gap-1.5">
                    <span className="w-[14px] h-[14px] rounded-full flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white" style={{ backgroundColor: m.avatarColor }}>
                      {m.user[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[8px] font-bold mr-1" style={{ color: m.isSystem ? '#FF9500' : 'rgba(255,255,255,0.5)' }}>{m.user}:</span>
                      <span className="text-[8.5px] text-white/70">{m.text}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Manual command injection */}
          <div className="flex gap-1.5 mt-2">
            <input
              type="text"
              value={manualCmd}
              onChange={e => setManualCmd(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendCmd()}
              placeholder="!sponsor topic / !tip 50 / !buy hoodie"
              className="flex-1 rounded-lg px-2.5 py-1.5 text-[10px] outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'monospace' }}
            />
            <button
              onClick={handleSendCmd}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95"
              style={{ background: 'rgba(0,113,227,0.2)', border: '1px solid rgba(0,113,227,0.3)', color: '#0071E3' }}
            >
              ▶
            </button>
          </div>
          <p className="text-[8px] text-white/20 mt-1">Inject commands as if sent from YouTube chat</p>
        </div>

        {/* ── Terminal Log ── */}
        <div style={panelStyle}>
          <div className="flex items-center justify-between mb-2">
            <SectionHeader icon="📟" title="System Log" />
            <button
              onClick={clearLogs}
              className="text-[8px] text-white/25 hover:text-white/50 transition-colors ml-auto"
            >
              clear
            </button>
          </div>
          <div
            className="rounded-xl p-2.5 h-[180px] overflow-y-auto"
            style={{
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.05)',
              fontFamily: 'monospace',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.1) transparent',
            }}
          >
            {logs.map((log, i) => {
              const isOk = log.includes('✓') || log.includes('completed');
              const isErr = log.includes('✗') || log.includes('failed') || log.includes('error');
              const isWarn = log.includes('⚠') || log.includes('fallback');
              return (
                <p
                  key={i}
                  className="text-[8.5px] leading-[1.6] mb-0.5"
                  style={{
                    color: isOk ? '#34C759' : isErr ? '#FF3B30' : isWarn ? '#FF9500' : 'rgba(255,255,255,0.45)',
                    wordBreak: 'break-word',
                  }}
                >
                  {log}
                </p>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* ── Quick Commands Reference ── */}
        <div style={{ ...panelStyle, marginBottom: 0 }}>
          <SectionHeader icon="📖" title="Chat Command Reference" />
          <div className="space-y-1.5">
            {[
              { cmd: '!tip [5/15/50/100]', desc: 'Trigger a ZK-Tip from viewer' },
              { cmd: '!sponsor [topic]', desc: 'Queue a sponsored broadcast topic' },
              { cmd: '!buy hoodie', desc: 'Show vault hoodie merch card' },
              { cmd: '!buy dossier', desc: 'Show dossier merch card' },
              { cmd: '!buy cap', desc: 'Show cap merch card' },
            ].map(({ cmd, desc }) => (
              <div key={cmd} className="flex items-center gap-2">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,149,0,0.1)', color: '#FF9500', border: '1px solid rgba(255,149,0,0.2)', flexShrink: 0 }}>{cmd}</span>
                <span className="text-[8px] text-white/30 truncate">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
