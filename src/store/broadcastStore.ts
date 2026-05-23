import { create } from 'zustand';
import type { Broadcast, PipelineStatus, ChannelConfig, DialogueLine, EpisodeSegment, ChatMessage } from '../types';
import { getRandomTopic } from '../services/mockData';

const DEFAULT_SEGMENTS: EpisodeSegment[] = [
  { id: 1, name: 'intro_sting', label: 'Intro Logo Sting', status: 'pending', progress: 0 },
  { id: 2, name: 'promo_hook', label: 'Episode Promo / Hook', status: 'pending', progress: 0 },
  { id: 3, name: 'main_programme', label: 'Main Programme Discussion', status: 'pending', progress: 0 },
  { id: 4, name: 'outro_credits', label: 'Outro Credits', status: 'pending', progress: 0 },
  { id: 5, name: 'end_promo', label: 'End Channel Promo', status: 'pending', progress: 0 },
];

const DEFAULT_CONFIG: ChannelConfig = {
  channelName: 'The Hidden Vault',
  tagline: 'Unlocking What They Don\'t Want You to Know',
  hostAvatar: '/images/host-avatar.jpg',
  guestAvatar: '/images/guest-avatar.jpg',
  hostName: 'Marcus Blackwell',
  guestName: 'Dr. Elena Vasquez',
  hostVoice: {
    id: 'host-v1',
    name: 'Authoritative Male',
    voice: 'en-US-ChristopherNeural',
    role: 'Host',
    pitch: '+0Hz',
    rate: '-2%',
  },
  guestVoice: {
    id: 'guest-v1',
    name: 'Expert Female',
    voice: 'en-US-EmmaNeural',
    role: 'Guest',
    pitch: '+0Hz',
    rate: '+2%',
  },
};

interface BroadcastState {
  // Current broadcast
  currentBroadcast: Broadcast | null;
  pipeline: PipelineStatus;
  config: ChannelConfig;
  
  // Playback state
  isPlaying: boolean;
  currentLineIndex: number;
  playbackProgress: number;
  activeSpeaker: 'Host' | 'Guest' | null;
  
  // UI state
  sidebarTab: 'production' | 'episodes' | 'settings';
  showIntro: boolean;
  showUpNext: boolean;
  episodeNumber: number;
  
  // Episode history
  episodes: Broadcast[];

  // Monetization state
  sponsoredQueue: { topic: string; sponsor: string }[];
  showMonetizationHub: boolean;
  supportersCount: number;
  totalTipsUSD: number;
  chatMessages: ChatMessage[];
  reactionTrigger: { emoji: string; key: number } | null;
  monetizationTrigger: { type: 'sponsor' | 'tip' | 'merch'; data: any; key: number } | null;

  // Operator Configuration
  geminiApiKey: string;
  groqApiKey: string;
  youtubeVideoId: string;
  rtmpUrl: string;
  streamKey: string;
  youtubeChatActive: boolean;
  isStreamingDirect: boolean;
  logs: string[];
  
  // Actions
  setCurrentBroadcast: (broadcast: Broadcast | null) => void;
  updatePipeline: (status: Partial<PipelineStatus>) => void;
  updateSegment: (segmentId: number, updates: Partial<EpisodeSegment>) => void;
  updateBroadcastState: (state: Broadcast['state']) => void;
  setScript: (script: DialogueLine[]) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentLineIndex: (index: number) => void;
  setPlaybackProgress: (progress: number) => void;
  setActiveSpeaker: (speaker: 'Host' | 'Guest' | null) => void;
  setSidebarTab: (tab: 'production' | 'episodes' | 'settings') => void;
  setShowIntro: (show: boolean) => void;
  setShowUpNext: (show: boolean) => void;
  incrementEpisode: () => void;
  updateConfig: (config: Partial<ChannelConfig>) => void;
  addEpisode: (episode: Broadcast) => void;
  initBroadcast: (topic: string) => void;

  // Operator Configuration Actions
  setGeminiApiKey: (key: string) => void;
  setGroqApiKey: (key: string) => void;
  setYoutubeVideoId: (id: string) => void;
  setRtmpUrl: (url: string) => void;
  setStreamKey: (key: string) => void;
  setYoutubeChatActive: (active: boolean) => void;
  setIsStreamingDirect: (streaming: boolean) => void;
  addLog: (text: string) => void;
  clearLogs: () => void;

  // Monetization Actions
  queueSponsoredTopic: (topic: string, sponsor: string) => void;
  popNextTopic: () => { topic: string; sponsor?: string };
  setMonetizationHubOpen: (open: boolean) => void;
  addTip: (amount: number, user: string, badgeName?: string) => void;
  addChatMessage: (msg: { user: string; text: string; avatarColor: string; isSystem?: boolean }) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  triggerReaction: (emoji: string) => void;
  clearReaction: () => void;
  clearMonetizationTrigger: () => void;
}

export const useBroadcastStore = create<BroadcastState>((set, get) => ({
  currentBroadcast: null,
  pipeline: {
    stage: 'idle',
    progress: 0,
    message: 'System Standing By',
  },
  config: DEFAULT_CONFIG,
  isPlaying: false,
  currentLineIndex: 0,
  playbackProgress: 0,
  activeSpeaker: null,
  sidebarTab: 'production',
  showIntro: false,
  showUpNext: false,
  episodeNumber: 1,
  episodes: [],

  // Monetization initial state
  sponsoredQueue: [],
  showMonetizationHub: false,
  supportersCount: 284,
  totalTipsUSD: 1245,
  chatMessages: [],
  reactionTrigger: null,
  monetizationTrigger: null,

  // Operator configuration initial state
  geminiApiKey: localStorage.getItem('operator_gemini_key') || '',
  groqApiKey: localStorage.getItem('operator_groq_key') || '',
  youtubeVideoId: localStorage.getItem('operator_youtube_id') || '',
  rtmpUrl: localStorage.getItem('operator_rtmp_url') || 'rtmp://a.rtmp.youtube.com/live2',
  streamKey: localStorage.getItem('operator_stream_key') || '',
  youtubeChatActive: false,
  isStreamingDirect: false,
  logs: [`[${new Date().toLocaleTimeString()}] System Engine initialized. Ready for operations.`],

  setCurrentBroadcast: (broadcast) => set({ currentBroadcast: broadcast }),
  
  updatePipeline: (status) => set((state) => {
    if (status.message) {
      get().addLog(status.message);
    }
    return {
      pipeline: { ...state.pipeline, ...status },
    };
  }),
  
  updateSegment: (segmentId, updates) => set((state) => {
    if (!state.currentBroadcast) return {};
    const segments = state.currentBroadcast.segments.map((s) =>
      s.id === segmentId ? { ...s, ...updates } : s
    );
    return {
      currentBroadcast: { ...state.currentBroadcast, segments },
    };
  }),

  updateBroadcastState: (broadcastState) => set((state) => ({
    currentBroadcast: state.currentBroadcast
      ? { ...state.currentBroadcast, state: broadcastState }
      : null,
  })),
  
  setScript: (script) => set((state) => ({
    currentBroadcast: state.currentBroadcast
      ? { ...state.currentBroadcast, script }
      : null,
  })),
  
  setPlaying: (playing) => {
    const action = playing ? "Starting broadcast playback loop" : "Pausing broadcast playback";
    get().addLog(action);
    set({ isPlaying: playing });
  },
  setCurrentLineIndex: (index) => set({ currentLineIndex: index }),
  setPlaybackProgress: (progress) => set({ playbackProgress: progress }),
  setActiveSpeaker: (speaker) => set({ activeSpeaker: speaker }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setShowIntro: (show) => set({ showIntro: show }),
  setShowUpNext: (show) => set({ showUpNext: show }),
  incrementEpisode: () => set((state) => ({ episodeNumber: state.episodeNumber + 1 })),
  
  updateConfig: (config) => set((state) => ({
    config: { ...state.config, ...config },
  })),
  
  addEpisode: (episode) => set((state) => ({
    episodes: [episode, ...state.episodes],
  })),
  
  initBroadcast: (topic) => {
    get().addLog(`Initializing new broadcast for topic: "${topic}"`);
    set({
      currentBroadcast: {
        id: crypto.randomUUID(),
        seedTopic: topic,
        title: '',
        description: '',
        state: 'idle',
        script: [],
        segments: DEFAULT_SEGMENTS.map((s) => ({ ...s })),
        createdAt: new Date().toISOString(),
      },
      currentLineIndex: 0,
      playbackProgress: 0,
      isPlaying: false,
      activeSpeaker: null,
      pipeline: {
        stage: 'idle',
        progress: 0,
        message: 'Broadcast initialized',
      },
    });
  },

  // Operator Actions Implementation
  setGeminiApiKey: (key) => {
    localStorage.setItem('operator_gemini_key', key);
    set({ geminiApiKey: key });
  },
  setGroqApiKey: (key) => {
    localStorage.setItem('operator_groq_key', key);
    set({ groqApiKey: key });
  },
  setYoutubeVideoId: (id) => {
    localStorage.setItem('operator_youtube_id', id);
    set({ youtubeVideoId: id });
  },
  setRtmpUrl: (url) => {
    localStorage.setItem('operator_rtmp_url', url);
    set({ rtmpUrl: url });
  },
  setStreamKey: (key) => {
    localStorage.setItem('operator_stream_key', key);
    set({ streamKey: key });
  },
  setYoutubeChatActive: (active) => {
    const status = active ? "Active (polling YouTube Live API)" : "Disconnected";
    get().addLog(`YouTube Live Chat service: ${status}`);
    set({ youtubeChatActive: active });
  },
  setIsStreamingDirect: (streaming) => {
    const status = streaming ? "ESTABLISHED (headlessly streaming to YouTube RTMP)" : "STOPPED";
    get().addLog(`Cloud-side streaming link: ${status}`);
    set({ isStreamingDirect: streaming });
  },
  addLog: (text) => set((state) => {
    const time = new Date().toLocaleTimeString();
    const newLog = `[${time}] ${text}`;
    return {
      logs: [...state.logs.slice(-99), newLog]
    };
  }),
  clearLogs: () => set({ logs: [] }),

  // Monetization Actions Implementation
  queueSponsoredTopic: (topic, sponsor) => {
    set((state) => {
      const newMsg = {
        id: Date.now() + Math.random(),
        user: 'SYSTEM',
        text: `💰 @${sponsor} sponsored the next broadcast topic: "${topic}"!`,
        avatarColor: '#34C759',
        isSystem: true,
      };
      get().addLog(`Monetization Action: Topic sponsored by @${sponsor}: "${topic}"`);
      return {
        sponsoredQueue: [...state.sponsoredQueue, { topic, sponsor }],
        supportersCount: state.supportersCount + 1,
        totalTipsUSD: state.totalTipsUSD + 25,
        chatMessages: [...state.chatMessages.slice(-20), newMsg],
      };
    });
  },

  popNextTopic: () => {
    const { sponsoredQueue } = get();
    if (sponsoredQueue.length > 0) {
      const nextItem = sponsoredQueue[0];
      set({ sponsoredQueue: sponsoredQueue.slice(1) });
      get().addLog(`Autopilot: Selecting next queued sponsored topic: "${nextItem.topic}" by @${nextItem.sponsor}`);
      return nextItem;
    }
    const randTopic = getRandomTopic();
    get().addLog(`Autopilot: Queue empty. Picking random topic from vault files: "${randTopic}"`);
    return { topic: randTopic };
  },

  setMonetizationHubOpen: (open) => set({ showMonetizationHub: open }),

  addTip: (amount, user, badgeName) => {
    set((state) => {
      const badgeText = badgeName ? ` (${badgeName})` : '';
      const newMsg = {
        id: Date.now() + Math.random(),
        user: 'SYSTEM',
        text: `💎 @${user} tipped $${amount}${badgeText}!`,
        avatarColor: '#FF9500',
        isSystem: true,
      };
      get().addLog(`Monetization Action: Received $${amount} tip from @${user}${badgeText}`);
      return {
        supportersCount: state.supportersCount + 1,
        totalTipsUSD: state.totalTipsUSD + amount,
        chatMessages: [...state.chatMessages.slice(-20), newMsg],
      };
    });
  },

  addChatMessage: (msg) => {
    set((state) => {
      const text = msg.text.trim();
      let trigger: { type: 'sponsor' | 'tip' | 'merch'; data: any } | null = null;
      
      if (text.startsWith('!')) {
        if (text.startsWith('!sponsor ')) {
          const topic = text.substring(9).trim();
          if (topic) {
            trigger = { type: 'sponsor', data: { topic, user: msg.user } };
          }
        } else if (text.startsWith('!tip')) {
          const parts = text.split(' ');
          const amountVal = parts[1] ? parseFloat(parts[1]) : 15;
          const amount = isNaN(amountVal) ? 15 : amountVal;
          trigger = { type: 'tip', data: { amount, user: msg.user } };
        } else if (text.startsWith('!buy ')) {
          const item = text.substring(5).trim().toLowerCase();
          if (['hoodie', 'dossier', 'cap'].includes(item)) {
            trigger = { type: 'merch', data: { item, user: msg.user } };
          }
        }
      }

      const nextMsg = {
        id: Date.now() + Math.random(),
        ...msg,
      };

      return {
        chatMessages: [...state.chatMessages.slice(-20), nextMsg],
        ...(trigger ? { monetizationTrigger: { ...trigger, key: Date.now() } } : {}),
      };
    });
  },

  setChatMessages: (messages) => set({ chatMessages: messages }),

  triggerReaction: (emoji) => set({ reactionTrigger: { emoji, key: Date.now() } }),
  clearReaction: () => set({ reactionTrigger: null }),
  clearMonetizationTrigger: () => set({ monetizationTrigger: null }),
}));

