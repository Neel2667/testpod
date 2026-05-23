export interface CenterVisual {
  type: 'bullets' | 'stat' | 'quote' | 'diagram' | 'timeline' | 'comparison';
  title: string;
  bullets?: string[];
  stat?: { value: string; label: string; sub?: string };
  quote?: { text: string; author: string };
  comparison?: { left: string; leftLabel: string; right: string; rightLabel: string };
  timeline?: { year: string; event: string }[];
  accent?: 'blue' | 'purple' | 'green' | 'orange' | 'red';
}

export interface DialogueLine {
  id: string;
  speaker: 'Host' | 'Guest';
  text: string;
  ticker_text: string;
  info_card: string;
  center_visual: CenterVisual;
  segment: number;
  duration?: number;
  audioUrl?: string;
}

export interface EpisodeSegment {
  id: number;
  name: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress: number;
}

export interface Broadcast {
  id: string;
  seedTopic: string;
  title: string;
  description: string;
  state: 'idle' | 'researching' | 'drafting' | 'synthesizing_audio' | 'rendering_canvas' | 'ready_for_review' | 'broadcasting' | 'archived';
  script: DialogueLine[];
  segments: EpisodeSegment[];
  createdAt: string;
  videoUrl?: string;
  totalDuration?: number;
  sponsorName?: string;
}

export interface VoiceProfile {
  id: string;
  name: string;
  voice: string;
  role: 'Host' | 'Guest';
  pitch: string;
  rate: string;
}

export interface ChannelConfig {
  channelName: string;
  tagline: string;
  hostAvatar: string;
  guestAvatar: string;
  hostName: string;
  guestName: string;
  hostVoice: VoiceProfile;
  guestVoice: VoiceProfile;
}

export type PipelineStage = 
  | 'idle'
  | 'topic_discovery' 
  | 'deep_research'
  | 'script_generation'
  | 'voice_synthesis'
  | 'video_composition'
  | 'final_render'
  | 'complete'
  | 'error';

export interface PipelineStatus {
  stage: PipelineStage;
  progress: number;
  message: string;
  startedAt?: string;
  estimatedCompletion?: string;
}

export interface ChatMessage {
  id: number;
  user: string;
  text: string;
  avatarColor: string;
  isSystem?: boolean;
}

