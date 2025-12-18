"use client";

import type { SoundType } from "@/app/types/schema";

type MoodClassification =
  | "calm"
  | "stressed"
  | "sad"
  | "reflective"
  | "energized"
  | "playful"
  | "confused";

type SoundConfig = {
  type: SoundType;
  leftHz?: number | null;
  rightHz?: number | null;
  volume?: number | null;
  classification?: MoodClassification | null;
};
type NoiseSoundType = Exclude<SoundType, "none" | "sine" | "binaural">;

const MIN_VOLUME = 0.05;
const FADE_DURATION = 0.3;
const BINAURAL_CARRIER = 200;
const NOISE_BUFFER_DURATION = 3;
const DEFAULT_VOLUME = 0.5;

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let oscLeft: OscillatorNode | null = null;
let oscRight: OscillatorNode | null = null;
let channelMerger: ChannelMergerNode | null = null;
let noiseSource: AudioBufferSourceNode | null = null;
let noiseNodes: AudioNode[] = [];
let noiseOscillators: OscillatorNode[] = [];
let noiseIntervalIds: number[] = [];

const trackNoiseNode = <T extends AudioNode>(node: T) => {
  noiseNodes.push(node);
  return node;
};

const trackNoiseOscillator = (osc: OscillatorNode) => {
  noiseOscillators.push(osc);
  return osc;
};

const trackNoiseInterval = (id: number) => {
  noiseIntervalIds.push(id);
};

const isBrowser = () => typeof window !== "undefined";

const ensureAudioContext = () => {
  if (!isBrowser()) return null;
  if (audioCtx) return audioCtx;

  const audioWindow = window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioCtor =
    audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
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

const stopNoiseModulators = () => {
  noiseOscillators.forEach((osc) => {
    try {
      osc.stop();
    } catch {
      /* ignore */
    }
    disconnectNode(osc);
  });
  noiseOscillators = [];

  if (typeof window !== "undefined") {
    noiseIntervalIds.forEach((id) => window.clearInterval(id));
  }
  noiseIntervalIds = [];
};

const clearNoiseNodes = () => {
  noiseNodes.forEach((node) => {
    disconnectNode(node);
  });
  noiseNodes = [];
};

const immediateDispose = () => {
  stopNoiseModulators();
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

  clearNoiseNodes();
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

type NoiseFilterConfig = {
  type: BiquadFilterType;
  frequency?: number;
  Q?: number;
  gain?: number;
};

type NoiseProfile = {
  volumeRange: [number, number];
  filter?: NoiseFilterConfig;
  stereoRange?: number;
  amplitudeLfo?: {
    frequency: number;
    depth: number;
  };
  amplitudeJitter?: {
    amount: number;
    interval: number;
  };
  panLfo?: {
    frequency: number;
  };
  randomPan?: {
    interval: number;
  };
  delay?: {
    time: number;
    mix: number;
  };
};

const DEFAULT_NOISE_PROFILE: NoiseProfile = {
  volumeRange: [0.3, 0.45],
  stereoRange: 0.25,
};

const NOISE_PROFILES: Record<MoodClassification, NoiseProfile> = {
  calm: {
    volumeRange: [0.25, 0.4],
    filter: { type: "lowpass", frequency: 4000, Q: 0.7 },
    stereoRange: 0.3,
    amplitudeLfo: { frequency: 0.25, depth: 0.08 },
  },
  stressed: {
    volumeRange: [0.45, 0.6],
    filter: { type: "lowshelf", frequency: 500, gain: 4 },
    stereoRange: 0.65,
    amplitudeJitter: { amount: 0.08, interval: 600 },
    panLfo: { frequency: 0.4 },
  },
  sad: {
    volumeRange: [0.2, 0.35],
    filter: { type: "lowpass", frequency: 2500, Q: 0.9 },
    stereoRange: 0.05,
  },
  reflective: {
    volumeRange: [0.3, 0.45],
    filter: { type: "highpass", frequency: 900, Q: 0.7 },
    stereoRange: 0.9,
    amplitudeLfo: { frequency: 0.15, depth: 0.05 },
    panLfo: { frequency: 0.12 },
    delay: { time: 0.03, mix: 0.25 },
  },
  energized: {
    volumeRange: [0.5, 0.7],
    filter: { type: "highpass", frequency: 2000, Q: 0.8 },
    stereoRange: 0.7,
    amplitudeLfo: { frequency: 0.8, depth: 0.15 },
    panLfo: { frequency: 0.6 },
  },
  playful: {
    volumeRange: [0.35, 0.5],
    filter: { type: "bandpass", frequency: 1400, Q: 0.9 },
    stereoRange: 0.5,
    amplitudeLfo: { frequency: 0.35, depth: 0.06 },
    randomPan: { interval: 900 },
  },
  confused: {
    volumeRange: [0.4, 0.5],
    filter: { type: "bandpass", frequency: 800, Q: 1.2 },
    stereoRange: 0.35,
    amplitudeJitter: { amount: 0.12, interval: 1300 },
    randomPan: { interval: 1400 },
  },
};

const getNoiseProfile = (
  classification?: MoodClassification | null
): NoiseProfile => {
  if (!classification) return DEFAULT_NOISE_PROFILE;
  return NOISE_PROFILES[classification] ?? DEFAULT_NOISE_PROFILE;
};

const randomBetween = (min: number, max: number) =>
  min + (max - min) * Math.random();

const determineNoiseVolume = (sound: SoundConfig) => {
  if (isNoiseType(sound.type)) {
    const profile = getNoiseProfile(sound.classification);
    const [min, max] = profile.volumeRange;
    return clamp(randomBetween(min, max), MIN_VOLUME, 1);
  }
  return clamp(sound.volume ?? DEFAULT_VOLUME, MIN_VOLUME, 1);
};

const applyStereoBehavior = (
  ctx: AudioContext,
  panner: StereoPannerNode,
  profile: NoiseProfile
) => {
  const range = profile.stereoRange ?? 0;
  if (range <= 0) {
    panner.pan.value = 0;
    return;
  }

  panner.pan.value = (Math.random() * 2 - 1) * (range / 2);

  if (profile.panLfo) {
    const lfo = trackNoiseOscillator(ctx.createOscillator());
    const depth = trackNoiseNode(ctx.createGain());
    lfo.frequency.value = profile.panLfo.frequency;
    depth.gain.value = range;
    lfo.connect(depth);
    depth.connect(panner.pan);
    lfo.start();
    return;
  }

  if (profile.randomPan && isBrowser()) {
    const context = ctx;
    const interval = window.setInterval(() => {
      const panValue = (Math.random() * 2 - 1) * range;
      panner.pan.linearRampToValueAtTime(
        panValue,
        context.currentTime + 0.4
      );
    }, profile.randomPan.interval);
    trackNoiseInterval(interval);
  }
};

const applyAmplitudeBehavior = (
  ctx: AudioContext,
  modGain: GainNode,
  profile: NoiseProfile
) => {
  if (profile.amplitudeLfo) {
    const lfo = trackNoiseOscillator(ctx.createOscillator());
    const depth = trackNoiseNode(ctx.createGain());
    lfo.frequency.value = profile.amplitudeLfo.frequency;
    depth.gain.value = profile.amplitudeLfo.depth;
    lfo.connect(depth);
    depth.connect(modGain.gain);
    lfo.start();
  }

  if (profile.amplitudeJitter && isBrowser()) {
    const { amount, interval } = profile.amplitudeJitter;
    const context = ctx;
    const jitterId = window.setInterval(() => {
      const jitter =
        1 + (Math.random() * 2 - 1) * Math.max(amount, 0.01);
      const now = context.currentTime;
      modGain.gain.setTargetAtTime(
        Math.max(0.05, jitter),
        now,
        0.2
      );
    }, interval);
    trackNoiseInterval(jitterId);
  }
};

type NoiseShapingOptions = {
  ctx: AudioContext;
  source: AudioBufferSourceNode;
  destination: GainNode;
  classification?: MoodClassification | null;
};

const routeNoiseThroughProcessors = ({
  ctx,
  source,
  destination,
  classification,
}: NoiseShapingOptions) => {
  const profile = getNoiseProfile(classification);
  let currentNode: AudioNode = source;

  const connectNode = <T extends AudioNode>(node: T) => {
    currentNode.connect(node);
    trackNoiseNode(node);
    currentNode = node;
    return node;
  };

  if (profile.filter) {
    const filter = connectNode(ctx.createBiquadFilter());
    filter.type = profile.filter.type;
    if (profile.filter.frequency) {
      filter.frequency.value = profile.filter.frequency;
    }
    if (profile.filter.Q) {
      filter.Q.value = profile.filter.Q;
    }
    if (profile.filter.gain !== undefined) {
      filter.gain.value = profile.filter.gain;
    }
  }

  if (profile.delay) {
    const mixNode = trackNoiseNode(ctx.createGain());
    const dryGain = trackNoiseNode(ctx.createGain());
    dryGain.gain.value = clamp(1 - profile.delay.mix, 0, 1);
    const wetGain = trackNoiseNode(ctx.createGain());
    wetGain.gain.value = clamp(profile.delay.mix, 0, 1);
    const delayNode = trackNoiseNode(ctx.createDelay());
    delayNode.delayTime.value = profile.delay.time;

    currentNode.connect(dryGain);
    dryGain.connect(mixNode);

    currentNode.connect(delayNode);
    delayNode.connect(wetGain);
    wetGain.connect(mixNode);

    currentNode = mixNode;
  }

  const panner = connectNode(ctx.createStereoPanner());

  const modGain = connectNode(ctx.createGain());
  modGain.gain.value = 1;

  currentNode.connect(destination);

  applyStereoBehavior(ctx, panner, profile);
  applyAmplitudeBehavior(ctx, modGain, profile);
};

const startNoise = (
  ctx: AudioContext,
  type: NoiseSoundType,
  gain: GainNode,
  classification?: MoodClassification | null
) => {
  const buffer = createNoiseBuffer(ctx, type);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  routeNoiseThroughProcessors({
    ctx,
    source,
    destination: gain,
    classification,
  });
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

  const targetVolume = determineNoiseVolume(sound);
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
    startNoise(ctx, sound.type, gain, sound.classification);
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

  stopNoiseModulators();

  const nodes = {
    left: oscLeft,
    right: oscRight,
    merger: channelMerger,
    gain,
    noise: noiseSource,
    noiseNodes: [...noiseNodes],
  };
  noiseNodes = [];

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
    nodes.noiseNodes.forEach((node) => {
      disconnectNode(node);
    });
  }, cleanupDelay);
}
