"use client";

import type { SoundType } from "@/app/types/schema";

type SoundConfig = {
  type: SoundType;
  leftHz?: number | null;
  rightHz?: number | null;
  volume?: number | null;
};
type NoiseSoundType = Exclude<SoundType, "none" | "sine" | "binaural">;

const MIN_VOLUME = 0.05;
const FADE_DURATION = 0.3;
const BINAURAL_CARRIER = 200;
const NOISE_BUFFER_DURATION = 3;

let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let oscLeft: OscillatorNode | null = null;
let oscRight: OscillatorNode | null = null;
let channelMerger: ChannelMergerNode | null = null;
let noiseSource: AudioBufferSourceNode | null = null;

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

  if (noiseSource) {
    try {
      noiseSource.stop();
    } catch {
      /* ignore */
    }
    disconnectNode(noiseSource);
    noiseSource = null;
  }
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

const stopBufferSource = (
  source: AudioBufferSourceNode | null,
  when?: number
) => {
  if (!source) return;
  try {
    if (typeof when === "number") {
      source.stop(when);
    } else {
      source.stop();
    }
  } catch {
    try {
      source.stop();
    } catch {
      /* ignore */
    }
  }
};

const fillPinkNoise = (data: Float32Array) => {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    b6 = white * 0.115926;
    const pink =
      b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] = pink * 0.11;
  }
};

const fillBrownNoise = (data: Float32Array) => {
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    last += white / 5;
    data[i] = Math.max(-1, Math.min(1, last));
  }
};

const fillBlueNoise = (data: Float32Array) => {
  let lastWhite = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    const value = (white - lastWhite) * 0.5;
    lastWhite = white;
    data[i] = Math.max(-1, Math.min(1, value));
  }
};

const createNoiseBuffer = (
  ctx: AudioContext,
  type: NoiseSoundType
) => {
  const bufferSize = Math.max(
    1,
    Math.floor(ctx.sampleRate * NOISE_BUFFER_DURATION)
  );
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);

  switch (type) {
    case "white_noise":
      for (let i = 0; i < output.length; i += 1) {
        output[i] = Math.random() * 2 - 1;
      }
      break;
    case "pink_noise":
      fillPinkNoise(output);
      break;
    case "brown_noise":
      fillBrownNoise(output);
      break;
    case "blue_noise":
      fillBlueNoise(output);
      break;
    default:
      for (let i = 0; i < output.length; i += 1) {
        output[i] = Math.random() * 2 - 1;
      }
      break;
  }

  return buffer;
};

const startNoise = (
  ctx: AudioContext,
  type: NoiseSoundType,
  gain: GainNode
) => {
  const buffer = createNoiseBuffer(ctx, type);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(gain);
  source.start();
  noiseSource = source;
};

const isNoiseType = (
  type: SoundConfig["type"]
): type is NoiseSoundType => type.endsWith("_noise");

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

  if (sound.type === "binaural") {
    const carrier = BINAURAL_CARRIER;
    const lowLeft = sound.leftHz ?? 4;
    const lowRight = sound.rightHz ?? lowLeft + 2;
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
    return;
  }

  if (isNoiseType(sound.type)) {
    startNoise(ctx, sound.type, gain);
    return;
  }
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
    noise: noiseSource,
  };

  stopOscillator(nodes.left, stopAt);
  stopOscillator(nodes.right, stopAt);
  stopBufferSource(nodes.noise, stopAt);

  oscLeft = null;
  oscRight = null;
  channelMerger = null;
  noiseSource = null;
  gainNode = null;

  const cleanupDelay = (FADE_DURATION + 0.1) * 1000;
  window.setTimeout(() => {
    disconnectNode(nodes.left);
    disconnectNode(nodes.right);
    disconnectNode(nodes.merger);
    disconnectNode(nodes.gain);
    disconnectNode(nodes.noise);
  }, cleanupDelay);
}
