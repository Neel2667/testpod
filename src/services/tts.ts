/**
 * TTS Engine — Neural Edge TTS via local API with browser SpeechSynthesis fallback.
 * Uses Web Audio API to analyze audio in real-time.
 */
import { useBroadcastStore } from '../store/broadcastStore';

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let globalAudio: HTMLAudioElement | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let inited = false;

export async function initTTS() {
  if (inited) return;
  inited = true;
  if (typeof window !== 'undefined') {
    globalAudio = new Audio();
    globalAudio.crossOrigin = "anonymous";

    // Setup Web Audio API immediately during the user gesture to avoid autoplay issues
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      try {
        audioContext = new AudioContextClass();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        sourceNode = audioContext.createMediaElementSource(globalAudio);
        sourceNode.connect(analyser);
        analyser.connect(audioContext.destination);

        // Resume AudioContext inside the user gesture
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
      } catch (e) {
        console.error('[TTS] Failed to init AudioContext in user gesture:', e);
      }
    }

    // Warm up the global Audio element with a tiny silent WAV data URL
    // This unlocks the audio element for future play() calls outside user gestures
    try {
      globalAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA";
      await globalAudio.play();
      globalAudio.pause();
      globalAudio.currentTime = 0;
      console.log('[TTS] Global audio element unlocked successfully.');
    } catch (e) {
      console.warn('[TTS] Failed to warm up global audio element:', e);
    }
  }
}

export function getAudioAnalyser(): AnalyserNode | null {
  if (typeof window === 'undefined') return null;

  if (!globalAudio) {
    initTTS();
  }

  // Safely attempt to resume suspended audio contexts
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(e => console.warn('[TTS] Failed to resume AudioContext:', e));
  }

  return analyser;
}

export function playIntroSting(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  if (!globalAudio) {
    initTTS();
  }

  return new Promise((resolve) => {
    // If Web Audio is not supported or initialization failed, fallback to a simple timeout
    if (!audioContext) {
      console.warn('[TTS] AudioContext not available. Falling back to timeout for Intro Sting.');
      setTimeout(resolve, 3500);
      return;
    }

    // Ensure AudioContext is running
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(e => console.warn('[TTS] Failed to resume AudioContext for sting:', e));
    }

    const now = audioContext.currentTime;
    const duration = 3.5; // duration of the sting in seconds

    // Create a master gain node for the intro sting
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.3, now + 0.2); // smooth fade in
    masterGain.gain.setValueAtTime(0.3, now + 2.0);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration); // smooth fade out

    // Connect master gain to the analyzer so the visualizer reacts
    if (analyser) {
      masterGain.connect(analyser);
    } else {
      masterGain.connect(audioContext.destination);
    }

    // 1. Cinematic Lowpass Sawtooth Rise (Drone/Sweep)
    const sweepOsc = audioContext.createOscillator();
    sweepOsc.type = 'sawtooth';
    sweepOsc.frequency.setValueAtTime(55, now); // start at low A (55Hz)
    sweepOsc.frequency.exponentialRampToValueAtTime(220, now + 2.0); // rise to A3 (220Hz)

    const sweepFilter = audioContext.createBiquadFilter();
    sweepFilter.type = 'lowpass';
    sweepFilter.frequency.setValueAtTime(100, now);
    sweepFilter.frequency.exponentialRampToValueAtTime(800, now + 1.8);
    sweepFilter.Q.setValueAtTime(4, now);

    sweepOsc.connect(sweepFilter);
    sweepFilter.connect(masterGain);

    // 2. Dual-Sine Bell Chime at 880Hz and 1320Hz
    const chime1 = audioContext.createOscillator();
    chime1.type = 'sine';
    chime1.frequency.setValueAtTime(880, now); // A5

    const chime2 = audioContext.createOscillator();
    chime2.type = 'sine';
    chime2.frequency.setValueAtTime(1320, now); // E6 (Fifth harmony)

    const chimeGain = audioContext.createGain();
    chimeGain.gain.setValueAtTime(0, now);
    chimeGain.gain.setValueAtTime(0, now + 1.0); // delay start by 1 second for drama
    chimeGain.gain.linearRampToValueAtTime(0.2, now + 1.1); // chime strike
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + duration); // bell decay

    chime1.connect(chimeGain);
    chime2.connect(chimeGain);
    chimeGain.connect(masterGain);

    // Start oscillators
    sweepOsc.start(now);
    chime1.start(now + 1.0);
    chime2.start(now + 1.0);

    // Stop oscillators
    sweepOsc.stop(now + duration);
    chime1.stop(now + duration);
    chime2.stop(now + duration);

    // Resolve promise when done
    setTimeout(() => {
      resolve();
    }, duration * 1000);
  });
}

export function speakLine(text: string, speaker: 'Host' | 'Guest', pregeneratedAudioUrl?: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  
  if (!globalAudio) {
    initTTS();
  }

  // Ensure analyzer is wired up
  getAudioAnalyser();

  // Retrieve dynamic voice config from store
  const config = useBroadcastStore.getState().config;
  const voiceProfile = speaker === 'Host' ? config.hostVoice : config.guestVoice;
  const voice = voiceProfile.voice;
  const rate = voiceProfile.rate;
  const pitch = voiceProfile.pitch;

  return new Promise(async (resolve) => {
    let resolved = false;

    const done = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    // Helper for browser speech synthesis fallback
    const runSpeechSynthesisFallback = () => {
      console.log('[TTS] API generation failed or unavailable. Falling back to window.speechSynthesis...');
      if (typeof speechSynthesis === 'undefined') {
        const words = text.split(/\s+/).length;
        const ms = Math.max(3000, (words / 150) * 60000);
        setTimeout(done, ms);
        return;
      }
      
      speechSynthesis.cancel();
      setTimeout(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        
        // Convert rate percentage (e.g. "-2%" or "+2%") to a float centered around 1.0
        let parsedRate = 1.0;
        if (rate.endsWith('%')) {
          const val = parseFloat(rate.slice(0, -1));
          if (!isNaN(val)) {
            parsedRate = 1.0 + (val / 100.0);
          }
        }
        u.rate = Math.max(0.5, Math.min(2.0, parsedRate));

        // Convert pitch string (e.g. "+0Hz", "-2Hz") to a pitch float
        let parsedPitch = 1.0;
        if (pitch.endsWith('Hz')) {
          const val = parseFloat(pitch.slice(0, -2));
          if (!isNaN(val)) {
            parsedPitch = 1.0 + (val / 50.0);
          }
        }
        u.pitch = Math.max(0.5, Math.min(2.0, parsedPitch));

        u.onend = () => done();
        u.onerror = () => done();
        try {
          speechSynthesis.speak(u);
        } catch (e) {
          console.error('[TTS] Fallback speechSynthesis error:', e);
          done();
        }
      }, 50);
    };

    const playAudio = async (audioUrl: string) => {
      if (globalAudio) {
        // Stop current audio if any
        globalAudio.pause();
        globalAudio.currentTime = 0;
        
        globalAudio.src = audioUrl;
        
        const onEnded = () => {
          globalAudio?.removeEventListener('ended', onEnded);
          globalAudio?.removeEventListener('error', onError);
          done();
        };

        const onError = (e: any) => {
          console.error('[TTS] Audio playback error:', e);
          globalAudio?.removeEventListener('ended', onEnded);
          globalAudio?.removeEventListener('error', onError);
          runSpeechSynthesisFallback();
        };

        globalAudio.addEventListener('ended', onEnded);
        globalAudio.addEventListener('error', onError);

        // Resume AudioContext if needed
        if (audioContext && audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        await globalAudio.play();
      } else {
        runSpeechSynthesisFallback();
      }
    };

    if (pregeneratedAudioUrl) {
      try {
        await playAudio(pregeneratedAudioUrl);
      } catch (error) {
        console.warn('[TTS] Failed to play pregenerated audio URL:', error);
        runSpeechSynthesisFallback();
      }
      return;
    }

    try {
      // Call /api/tts endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, rate, pitch }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data.audioUrl) {
        throw new Error('No audioUrl in response');
      }

      await playAudio(data.audioUrl);
    } catch (error) {
      console.warn('[TTS] Failed to fetch or play from backend TTS API:', error);
      runSpeechSynthesisFallback();
    }
  });
}

export function stopSpeech() {
  if (globalAudio) {
    globalAudio.pause();
    globalAudio.currentTime = 0;
  }
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel();
  }
}

