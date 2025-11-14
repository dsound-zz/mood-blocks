"use client";

type SoundConfig = {
  type: "none" | "sine" | "binaural";
  leftHz?: number | null;
  rightHz?: number | null;
  volume?: number | null;
};

const MIN_VOLUME = 0.05;
const FADE_DURATION = 0.3;
const BINAURAL_CARRIER = 200;

let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let oscLeft: OscillatorNode | null = null;
let oscRight: OscillatorNode | null = null;
let channelMerger: ChannelMergerNode | null = null;

const isBrowser = () => typeof window !== "undefined";

const ensureAudioContext = () => {
  if (!isBrowser()) return null;
  if (audioCtx) return audioCtx;

  const AudioCtor =
    window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtor) return null;
  audioCtx = new AudioCtor();
  return audioCtx;
};

const disconnectNode = (node?: AudioNode | null) => {
  if (!node) return;
  try {
    node.disconnect();
  } catch {
    /* ignore */
  }
};

const immediateDispose = () => {
  [oscLeft, oscRight].forEach((osc) => {
    if (!osc) return;
    try {
      osc.stop();
    } catch {
      /* ignore */
    }
    disconnectNode(osc);
  });
  oscLeft = null;
  oscRight = null;

  disconnectNode(channelMerger);
  channelMerger = null;

  disconnectNode(gainNode);
  gainNode = null;
};

const stopOscillator = (osc: OscillatorNode | null, when: number) => {
  if (!osc) return;
  try {
    osc.stop(when);
  } catch {
    try {
      osc.stop();
    } catch {
      /* ignore */
    }
  }
};

export async function unlockAudio() {
  if (!isBrowser()) return;
  const ctx = ensureAudioContext();
  if (ctx && ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* ignore */
    }
  }
}

export function startSound(sound?: SoundConfig | null) {
  if (!isBrowser()) return;
  if (!sound || sound.type === "none") {
    stopSound();
    return;
  }

  const ctx = ensureAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  immediateDispose();

  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gainNode = gain;

  const targetVolume = Math.max(MIN_VOLUME, sound.volume ?? 0.5);
  gain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + FADE_DURATION);

  if (sound.type === "sine") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const freq = sound.leftHz ?? sound.rightHz ?? 432;
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start();
    oscLeft = osc;
    oscRight = null;
    return;
  }

  const carrier = BINAURAL_CARRIER;
  const lowLeft = sound.leftHz ?? 4;
  const lowRight = sound.rightHz ?? (lowLeft + 2);
  const freqLeft = carrier + lowLeft;
  const freqRight = carrier + lowRight;

  const left = ctx.createOscillator();
  left.type = "sine";
  left.frequency.value = freqLeft;

  const right = ctx.createOscillator();
  right.type = "sine";
  right.frequency.value = freqRight;

  const merger = ctx.createChannelMerger(2);
  channelMerger = merger;

  left.connect(merger, 0, 0);
  right.connect(merger, 0, 1);
  merger.connect(gain);

  left.start();
  right.start();

  oscLeft = left;
  oscRight = right;
}

export function stopSound() {
  if (!isBrowser()) {
    immediateDispose();
    audioCtx = null;
    return;
  }

  const ctx = audioCtx;
  if (!ctx || !gainNode) {
    immediateDispose();
    return;
  }

  const gain = gainNode;
  const now = ctx.currentTime;
  const stopAt = now + FADE_DURATION;

  gain.gain.cancelScheduledValues(now);
  const currentValue = gain.gain.value ?? 0;
  gain.gain.setValueAtTime(currentValue, now);
  gain.gain.linearRampToValueAtTime(0, stopAt);

  const nodes = {
    left: oscLeft,
    right: oscRight,
    merger: channelMerger,
    gain,
  };

  stopOscillator(nodes.left, stopAt);
  stopOscillator(nodes.right, stopAt);

  oscLeft = null;
  oscRight = null;
  channelMerger = null;
  gainNode = null;

  const cleanupDelay = (FADE_DURATION + 0.1) * 1000;
  window.setTimeout(() => {
    disconnectNode(nodes.left);
    disconnectNode(nodes.right);
    disconnectNode(nodes.merger);
    disconnectNode(nodes.gain);
  }, cleanupDelay);
}
