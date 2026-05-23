import { useBroadcastStore } from '../store/broadcastStore';
import { generateMockScript, getRandomTopic, getRandomGuest } from './mockData';

// Utility to create async delays simulating processing time
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to fetch audio duration on the client side
function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      // duration is in seconds, convert to milliseconds
      resolve(audio.duration * 1000);
    });
    audio.addEventListener('error', () => {
      resolve(5000); // fallback default
    });
  });
}

// Groq/Gemini API adapter calling Flask backend
async function groqResearchAgent(topic: string): Promise<string> {
  try {
    useBroadcastStore.getState().addLog(`Researching topic on Wikipedia: "${topic}"...`);
    const response = await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    if (!response.ok) {
      throw new Error(`Research API status: ${response.status}`);
    }
    const data = await response.json();
    useBroadcastStore.getState().addLog(`Wikipedia research completed: "${data.title || topic}"`);
    return data.research || 'No research found.';
  } catch (error) {
    console.warn('[Pipeline] Research API failed, falling back to local simulation:', error);
    useBroadcastStore.getState().addLog(`Research API failed. Falling back to local declassified records.`);
    await delay(1000);
    return `Declassified database check for "${topic}" completed. Analyzing local intelligence files.`;
  }
}

async function groqScriptGenerator(topic: string, research: string, guest: { name: string; full: string }, sponsorName?: string) {
  try {
    const { geminiApiKey, groqApiKey } = useBroadcastStore.getState();
    useBroadcastStore.getState().addLog(`Generating dialogue script for "${topic}" via AI agents...`);
    const response = await fetch('/api/generate-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        research,
        guestName: guest.full,
        sponsorName,
        geminiApiKey,
        groqApiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Script API status: ${response.status}`);
    }

    const data = await response.json();
    if (data.fallback) {
      console.warn('[Pipeline] Backend requested fallback:', data.message);
      useBroadcastStore.getState().addLog(`AI script generation fallback: ${data.message}`);
      return generateMockScript(topic, guest);
    }

    if (data.script && Array.isArray(data.script)) {
      useBroadcastStore.getState().addLog(`✓ AI script compiled successfully with ${data.script.length} lines.`);
      return data.script;
    }
    throw new Error('Invalid script format returned from API');
  } catch (error) {
    console.warn('[Pipeline] Script generation API failed, falling back to mock generator:', error);
    useBroadcastStore.getState().addLog(`AI script generation failed. Falling back to simulated broadcast script.`);
    return generateMockScript(topic, guest);
  }
}

// Edge-TTS voice synthesis adapter calling Flask backend
async function synthesizeVoice(
  text: string,
  voice: string,
  pitch: string,
  rate: string,
  index: number
): Promise<{ audioUrl: string; duration: number }> {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, rate, pitch }),
    });

    if (!response.ok) {
      throw new Error(`TTS API status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.audioUrl) {
      throw new Error('No audioUrl in TTS response');
    }

    const duration = await getAudioDuration(data.audioUrl);
    return {
      audioUrl: data.audioUrl,
      duration,
    };
  } catch (error) {
    console.warn('[Pipeline] TTS synthesis API failed, falling back to simulated chunk:', error);
    const words = text.split(/\s+/).length;
    const estimatedMs = Math.max(3000, (words / 150) * 60000);
    return {
      audioUrl: `/audio/chunk_${index}.mp3`,
      duration: estimatedMs,
    };
  }
}

// Simulated MoviePy/FFmpeg video compositor
export async function compositeVideo(
  _script: ReturnType<typeof generateMockScript>,
  _audioChunks: { audioUrl: string; duration: number }[]
): Promise<string> {
  // In production: FFmpeg/MoviePy pipeline
  await delay(4000);
  return `/output/broadcast_${Date.now()}.mp4`;
}

// Main pipeline orchestrator
export async function runProductionPipeline(seedTopic?: string, sponsorName?: string) {
  const store = useBroadcastStore.getState();
  const topic = seedTopic || getRandomTopic();

  // Pick a random guest
  const guest = getRandomGuest();
  
  // Initialize broadcast
  store.initBroadcast(topic);
  store.updateConfig({ guestName: guest.full });

  const broadcastId = useBroadcastStore.getState().currentBroadcast?.id;
  if (!broadcastId) return;

  const isObsolete = () => {
    const currentId = useBroadcastStore.getState().currentBroadcast?.id;
    return currentId !== broadcastId;
  };

  // Set the title and sponsor on currentBroadcast so it shows in the header immediately
  const currentBroadcast = useBroadcastStore.getState().currentBroadcast;
  if (currentBroadcast) {
    useBroadcastStore.setState({
      currentBroadcast: {
        ...currentBroadcast,
        title: topic,
        sponsorName: sponsorName,
      },
    });
  }

  const sponsorIntro = sponsorName 
    ? `, proudly sponsored tonight by @${sponsorName},`
    : '';

  // Generate local Segment 2 (Promo) dialogue line immediately
  const segment2Line = {
    id: crypto.randomUUID(),
    speaker: 'Host' as const,
    text: `Coming up on The Hidden Vault${sponsorIntro}: we are opening the files on ${topic}. Are we looking at a genuine scientific breakthrough, or a carefully managed institutional diversion? Here is your first look.`,
    ticker_text: sponsorName 
      ? `SPONSORED BY @${sponsorName} — TOPIC: ${topic}`
      : `COMING UP: Deep investigation into ${topic}`,
    info_card: sponsorName
      ? `Tonight's File\n• Sponsored by @${sponsorName}\n• Declassified information on ${topic}\n• What they kept hidden`
      : `Tonight's File\n• Declassified information on ${topic}\n• Behind the official story\n• What they kept hidden`,
    center_visual: {
      type: 'bullets' as const,
      accent: 'blue' as const,
      title: sponsorName ? `SPONSORED BY @${sponsorName}` : 'COMING UP',
      bullets: sponsorName
        ? [
            `Topic requested by @${sponsorName}`,
            'Declassified data on the record',
            'The real story behind the public narrative',
          ]
        : [
            'Declassified data on the record',
            'Institutional gatekeepers under fire',
            'The real story behind the public narrative',
          ],
    },
    segment: 2,
    duration: 14000,
    audioUrl: '', // Will be filled after synthesis
  };

  // Set the script to initially contain only our Segment 2 line
  store.setScript([segment2Line]);

  // Start Segment 2 TTS voice synthesis in the background (non-blocking)
  const hostVoice = store.config.hostVoice;
  synthesizeVoice(segment2Line.text, hostVoice.voice, hostVoice.pitch, hostVoice.rate, 0)
    .then((chunk) => {
      if (isObsolete()) return;
      const currentScript = useBroadcastStore.getState().currentBroadcast?.script || [];
      const updatedScript = [...currentScript];
      if (updatedScript[0]) {
        updatedScript[0] = { ...updatedScript[0], duration: chunk.duration, audioUrl: chunk.audioUrl };
      }
      useBroadcastStore.getState().setScript(updatedScript);
    })
    .catch((err) => {
      console.error('[Pipeline] Segment 2 TTS failed:', err);
    });

  // Run the remaining pipeline asynchronously in the background
  (async () => {
    try {
      // Stage 1: Topic Discovery
      store.updatePipeline({
        stage: 'topic_discovery',
        progress: 10,
        message: `Scanning trending databases for: "${topic}"`,
        startedAt: new Date().toISOString(),
      });
      store.updateBroadcastState('researching');

      // Stage 2: Deep Research
      store.updatePipeline({
        stage: 'deep_research',
        progress: 25,
        message: 'Deploying multi-agent research swarm...',
      });
      const research = await groqResearchAgent(topic);
      if (isObsolete()) return;

      // Stage 3: Script Generation
      store.updatePipeline({
        stage: 'script_generation',
        progress: 50,
        message: 'Generating full broadcast script...',
      });
      store.updateBroadcastState('drafting');

      const generatedScript = await groqScriptGenerator(topic, research, guest, sponsorName);
      if (isObsolete()) return;

      // Filter out segment 2 lines from the generated script to avoid duplicates
      const filteredScript = generatedScript.filter((line: any) => line.segment > 2);

      // Append segments 3, 4, 5 to the active script
      const latestScript = useBroadcastStore.getState().currentBroadcast?.script || [];
      const segment2LineActive = latestScript[0] || segment2Line;
      const updatedScript = [segment2LineActive, ...filteredScript];
      store.setScript(updatedScript);

      // Update broadcast details with research description
      const currentB = useBroadcastStore.getState().currentBroadcast;
      if (currentB && !isObsolete()) {
        useBroadcastStore.setState({
          currentBroadcast: {
            ...currentB,
            description: research,
          },
        });
      }

      // Stage 4: Voice Synthesis
      store.updatePipeline({
        stage: 'voice_synthesis',
        progress: 60,
        message: 'Synthesizing voice tracks...',
      });
      store.updateBroadcastState('synthesizing_audio');

      const config = store.config;
      const audioChunks: { audioUrl: string; duration: number }[] = [];

      // Loop and synthesize remaining lines (index 1 to end)
      for (let i = 1; i < updatedScript.length; i++) {
        if (isObsolete()) return;
        const line = updatedScript[i];
        const voice = line.speaker === 'Host' ? config.hostVoice : config.guestVoice;
        const chunk = await synthesizeVoice(line.text, voice.voice, voice.pitch, voice.rate, i);
        if (isObsolete()) return;
        
        audioChunks.push(chunk);

        // Update individual line with duration and audioUrl
        const currentScriptState = useBroadcastStore.getState().currentBroadcast?.script || [];
        const liveUpdatedScript = [...currentScriptState];
        if (liveUpdatedScript[i]) {
          liveUpdatedScript[i] = {
            ...liveUpdatedScript[i],
            duration: chunk.duration,
            audioUrl: chunk.audioUrl,
          };
        }
        store.setScript(liveUpdatedScript);

        const synthProgress = 60 + (i / updatedScript.length) * 30;
        store.updatePipeline({
          progress: synthProgress,
          message: `Voice synthesis: ${i}/${updatedScript.length - 1} chunks rendered (${line.speaker})`,
        });
      }

      // Stage 5: Finalize and Complete
      store.updatePipeline({
        stage: 'complete',
        progress: 100,
        message: '✓ Broadcast package complete',
      });
      store.updateBroadcastState('ready_for_review');

      // Add episode to history
      const finalBroadcast = useBroadcastStore.getState().currentBroadcast;
      if (finalBroadcast && !isObsolete()) {
        useBroadcastStore.setState({
          currentBroadcast: {
            ...finalBroadcast,
            totalDuration: audioChunks.reduce((sum, c) => sum + c.duration, 0) + (segment2LineActive.duration || 0),
            state: 'ready_for_review',
          },
        });
        store.addEpisode({
          ...finalBroadcast,
          totalDuration: audioChunks.reduce((sum, c) => sum + c.duration, 0) + (segment2LineActive.duration || 0),
          state: 'ready_for_review',
        });
      }
    } catch (err) {
      console.error('[Pipeline] Error in background execution:', err);
      store.updatePipeline({
        stage: 'idle',
        message: 'Pipeline failed. Retrying...',
      });
    }
  })();
}
