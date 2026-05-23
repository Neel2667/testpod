import { useBroadcastStore } from '../store/broadcastStore';
import { runProductionPipeline } from './pipeline';
import { initTTS, speakLine, stopSpeech, playIntroSting } from './tts';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let running = false;

export async function startAutopilot() {
  if (running) return;
  running = true;

  await initTTS();

  while (running) {
    try {
      const { topic, sponsor } = useBroadcastStore.getState().popNextTopic();
      // 1. Start pipeline in background
      runProductionPipeline(topic, sponsor);

      // Wait until the broadcast is initialized in the store
      while (running && !useBroadcastStore.getState().currentBroadcast) {
        await delay(50);
      }
      if (!running) break;

      const state = useBroadcastStore.getState();

      // 2. Intro Logo Sting (Segment 1) — starts immediately
      useBroadcastStore.getState().updateSegment(1, { status: 'active', progress: 30 });
      state.setShowIntro(true);
      await delay(600);
      
      useBroadcastStore.getState().updateSegment(1, { status: 'active', progress: 70 });
      // Play cinematic synthesized intro sting sound (blocks for ~3.5 seconds)
      await playIntroSting();

      useBroadcastStore.getState().updateSegment(1, { status: 'completed', progress: 100 });
      useBroadcastStore.getState().setShowIntro(false);
      await delay(400);

      if (!running) break;

      // 3. Play each line with real TTS — autopilot drives the loop
      const store = useBroadcastStore.getState();
      store.setPlaying(true);

      let currentIndex = 0;
      while (running) {
        const currentScript = useBroadcastStore.getState().currentBroadcast?.script ?? [];
        const pipeline = useBroadcastStore.getState().pipeline;
        const isPipelineDone = pipeline.stage === 'complete' || pipeline.stage === 'idle';

        if (currentIndex >= currentScript.length) {
          if (isPipelineDone) {
            // Finished playing everything and the pipeline is done
            break;
          }
          // Script is still generating, wait a bit
          await delay(200);
          continue;
        }

        // Poll until this line has audioUrl populated by the background TTS synthesizer
        let line = currentScript[currentIndex];
        while (running && (!line || !line.audioUrl)) {
          await delay(100);
          const freshScript = useBroadcastStore.getState().currentBroadcast?.script ?? [];
          line = freshScript[currentIndex];
        }

        if (!running || !line) break;

        const currentSegmentId = line.segment || 2; // fallback to 2 (Promo) if not set

        // Compute segment-specific progress
        const scriptState = useBroadcastStore.getState().currentBroadcast?.script ?? [];
        const segmentLines = scriptState.filter(l => l.segment === currentSegmentId);
        // Find line in the current script state
        const stateLine = scriptState[currentIndex];
        const segmentLineIndex = segmentLines.findIndex(l => l.id === stateLine?.id);
        const segmentProgress = segmentLines.length > 0
          ? Math.round(((segmentLineIndex + 1) / segmentLines.length) * 100)
          : 100;

        const storeState = useBroadcastStore.getState();

        // Update active segment
        storeState.updateSegment(currentSegmentId, {
          status: segmentProgress === 100 ? 'completed' : 'active',
          progress: segmentProgress
        });

        // Clean up other segments' status
        for (let segId = 1; segId <= 5; segId++) {
          if (segId < currentSegmentId) {
            storeState.updateSegment(segId, { status: 'completed', progress: 100 });
          } else if (segId > currentSegmentId) {
            storeState.updateSegment(segId, { status: 'pending', progress: 0 });
          }
        }

        // Update store for visuals
        storeState.setCurrentLineIndex(currentIndex);
        storeState.setActiveSpeaker(line.speaker);

        // Speak the line — this blocks until speech finishes
        // Pass line.audioUrl to use pre-synthesized Edge-TTS audio
        await speakLine(line.text, line.speaker, line.audioUrl);

        // Brief pause between lines
        await delay(400);

        currentIndex++;
      }

      if (!running) break;

      // 4. End playback
      const storeState = useBroadcastStore.getState();
      storeState.setPlaying(false);
      storeState.setActiveSpeaker(null);
      stopSpeech();

      // Mark all segments completed at the end
      for (let segId = 1; segId <= 5; segId++) {
        storeState.updateSegment(segId, { status: 'completed', progress: 100 });
      }

      // 5. Up Next
      await delay(500);
      const s2 = useBroadcastStore.getState();
      s2.setShowUpNext(true);
      s2.incrementEpisode();
      
      // Dynamic non-blocking wait for countdown (can be cancelled immediately if stopped)
      for (let c = 0; c < 80; c++) {
        if (!running) break;
        await delay(100);
      }
      useBroadcastStore.getState().setShowUpNext(false);
      await delay(500);

    } catch (err) {
      console.error('[Autopilot] Error:', err);
      stopSpeech();
      await delay(3000);
    }
  }
}

export function stopAutopilot() {
  running = false;
  stopSpeech();
  const storeState = useBroadcastStore.getState();
  storeState.setPlaying(false);
  storeState.setActiveSpeaker(null);
}
