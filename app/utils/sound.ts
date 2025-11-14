"use client";

import type { MoodComponentSchema } from "@/app/types/schema";

type SoundConfig = MoodComponentSchema["sound"];

let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;
let channelMerger: ChannelMergerNode | null = null;
let activeOscillators: OscillatorNode[] = [];

const MIN_VOLUME = 0.05;
const FADE_TIME = 0.3;

const isBrowser = () => typeof window !== "undefined";

const createAudioContext = () => {
  if (!isBrowser()) return null;
  if (audioContext) return audioContext;

  const AudioCtx =
    window.AudioContext || (window as any).webkitAudioContext;
  audioContext = new AudioCtx();
  return audioContext;
};

export async function prepareAudioContext() {
  if (!isBrowser()) return;
  const ctx = createAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // ignore resume errors
    }
  }
}

const resetNodes = () => {
  activeOscillators.forEach((osc) => {
    try {
      osc.stop();
    } catch {
      /* already stopped */
    }
    try {
      osc.disconnect();
    } catch {
      /* no-op */
    }
  });
  activeOscillators = [];

  if (channelMerger) {
    try {
      channelMerger.disconnect();
    } catch {
      /* no-op */
    }
    channelMerger = null;
  }

  if (gainNode) {
    try {
      gainNode.disconnect();
    } catch {
      /* no-op */
    }
    gainNode = null;
  }
};

export async function startSound(sound?: SoundConfig) {
  if (!isBrowser()) return;
  if (!sound || sound.type === "none") {
    stopSound();
    return;
  }

  await prepareAudioContext();
  const ctx = audioContext;
  if (!ctx) return;

  resetNodes();

  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  gain.connect(ctx.destination);
  gainNode = gain;

  const targetVolume = Math.max(sound.volume ?? 0.3, MIN_VOLUME);
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(targetVolume, now + FADE_TIME);

  if (sound.type === "sine") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = sound.frequencyLeft ?? 432;
    osc.connect(gain);
    osc.start();
    activeOscillators = [osc];
    console.log(
      "[MoodBlocks] Playing sine tone",
      osc.frequency.value.toFixed(2),
      "Hz"
    );
    return;
  }

  if (sound.type === "binaural") {
    const leftFreq = sound.frequencyLeft ?? 200;
    const rightFreq = sound.frequencyRight ?? leftFreq + 4;

    const left = ctx.createOscillator();
    const right = ctx.createOscillator();
    left.type = "sine";
    right.type = "sine";
    left.frequency.value = leftFreq;
    right.frequency.value = rightFreq;

    const merger = ctx.createChannelMerger(2);
    channelMerger = merger;

    left.connect(merger, 0, 0);
    right.connect(merger, 0, 1);
    merger.connect(gain);

    left.start();
    right.start();
    activeOscillators = [left, right];
    console.log("[MoodBlocks] Playing binaural beat", {
      leftHz: leftFreq,
      rightHz: rightFreq,
    });
  }
}

export function stopSound() {
  if (!isBrowser()) {
    resetNodes();
    audioContext = null;
    return;
  }

  if (!audioContext || !gainNode) {
    resetNodes();
    if (audioContext) {
      audioContext
        .close()
        .catch(() => {
          /* ignore */
        });
      audioContext = null;
    }
    return;
  }

  const ctx = audioContext;
  const now = ctx.currentTime;
  const stopTime = now + FADE_TIME;

  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(gainNode.gain.value || 0.0001, now);
  gainNode.gain.linearRampToValueAtTime(0.0001, stopTime);

  activeOscillators.forEach((osc) => {
    try {
      osc.stop(stopTime);
    } catch {
      try {
        osc.stop();
      } catch {
        /* ignore */
      }
    }
  });

  audioContext = null;

  window.setTimeout(() => {
    resetNodes();
    ctx
      .close()
      .catch(() => {
        /* ignore */
      });
  }, (FADE_TIME + 0.1) * 1000);
}
