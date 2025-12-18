import { NextResponse } from "next/server";
import type {
  MoodComponentSchema,
  MotionEffect,
  NatureScene,
} from "@/app/types/schema";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const EFFECTS: MoodComponentSchema["effect"][] = [
  "gradient",
  "splatter",
  "pulse",
  "haze",
  "particles",
  "ripple",
];
const SOUND_TYPES: MoodComponentSchema["sound"]["type"][] = [
  "none",
  "sine",
  "binaural",
  "white_noise",
  "pink_noise",
  "brown_noise",
  "blue_noise",
];
const NATURE_SCENES: NatureScene[] = [
  "rain",
  "ocean",
  "forest",
  "wind",
  "fire",
  "night",
  "river",
  "birds",
];
const MOTION_TYPES: MotionEffect[] = [
  "none",
  "bubbles",
  "geometry",
  "ripples",
];

const CURSE_PATTERNS = [
  /\bfuck\w*/i,
  /\bshit\w*/i,
  /\bbitch\w*/i,
  /\basshole\w*/i,
  /\bbastard\w*/i,
  /\bcunt\w*/i,
  /\bmotherfucker\w*/i,
];
const CURSE_MESSAGE = "Take a breath.";
const KEYBOARD_SLAM_PATTERNS = [
  /(.)\1{3,}/i,
  /[asdfghjkl]{5,}/i,
  /[zxcvbnm]{5,}/i,
  /[!@#$%^&*()_\-+=]{5,}/,
];

const PROMPT_TEMPLATE = (mood: string) => `
You are generating UI instructions for a mood visualizer.
The user is feeling: "${mood}".

Return ONLY JSON in this format:

{
  "type": "mood_display",
  "color": "<hex or rgb>",
  "effect": "<gradient | splatter | pulse | haze | particles | ripple>",
  "intensity": <number 0–1>,
  "sound": {
    "type": "<none | sine | binaural>",
    "leftHz": <number or null>,
    "rightHz": <number or null>,
    "volume": <0–1>
  }
}

Effect guidelines:
- calm, peaceful → gradient or pulse; blues/teals; sine 432 Hz.
- anxious, overwhelmed → haze or pulse; soft purple; binaural 4–6 Hz.
- sad, reflective → haze or ripple; indigo; low-volume sine.
- energetic, excited → splatter or particles; oranges; alpha 10–12 Hz.

Only return JSON. No explanations.
`;

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

type RawSound = {
  type?: unknown;
  leftHz?: unknown;
  rightHz?: unknown;
  volume?: unknown;
  frequencyLeft?: unknown;
  frequencyRight?: unknown;
};

type RawNature = {
  scene?: unknown;
};

const sanitizeSchema = (data: unknown): MoodComponentSchema => {
  const raw =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)
      : {};
  const rawSound: RawSound =
    typeof raw.sound === "object" && raw.sound !== null
      ? (raw.sound as RawSound)
      : {};
  const rawNature: RawNature =
    typeof raw.nature === "object" && raw.nature !== null
      ? (raw.nature as RawNature)
      : {};

  const effectValue = raw.effect;
  const effect =
    typeof effectValue === "string" &&
    EFFECTS.includes(effectValue as MoodComponentSchema["effect"])
      ? (effectValue as MoodComponentSchema["effect"])
      : "gradient";

  const soundType =
    typeof rawSound.type === "string" &&
    SOUND_TYPES.includes(
      rawSound.type as MoodComponentSchema["sound"]["type"]
    )
      ? (rawSound.type as MoodComponentSchema["sound"]["type"])
      : "none";

  const natureScene =
    typeof rawNature.scene === "string" ? rawNature.scene : null;
  const normalizedNature = natureScene
    ? NATURE_SCENES.includes(natureScene as NatureScene)
      ? { scene: natureScene as NatureScene }
      : undefined
    : undefined;

  const motionType =
    typeof raw.motion === "string" &&
    MOTION_TYPES.includes(raw.motion as MotionEffect)
      ? (raw.motion as MotionEffect)
      : undefined;

  const parseHz = (value: unknown) =>
    typeof value === "number" ? value : undefined;

  return {
    type: "mood_display",
    color: typeof raw.color === "string" ? raw.color : "#0f172a",
    effect,
    intensity: clamp(
      typeof raw.intensity === "number" ? (raw.intensity as number) : 0.5
    ),
    sound: {
      type: soundType,
      leftHz:
        parseHz(rawSound.leftHz) ??
        parseHz(rawSound.frequencyLeft),
      rightHz:
        parseHz(rawSound.rightHz) ??
        parseHz(rawSound.frequencyRight),
      volume:
        typeof rawSound.volume === "number"
          ? clamp(rawSound.volume as number)
          : 0.3,
    },
    message:
      typeof raw.message === "string"
        ? (raw.message as string)
        : undefined,
    nature: normalizedNature,
    motion: motionType,
  };
};

const fallbackSchema: MoodComponentSchema = {
  type: "mood_display",
  color: "#0f172a",
  effect: "gradient",
  intensity: 0.5,
  sound: {
    type: "none",
    volume: 0.2,
  },
  motion: "bubbles",
};

const applyCalmingDefaults = (
  schema: MoodComponentSchema = fallbackSchema
): MoodComponentSchema => ({
  ...schema,
  color: "#6b7fd8",
  effect: "haze",
  intensity: 0.35,
  sound: {
    type: "pink_noise",
    volume: 0.18,
  },
  message: CURSE_MESSAGE,
});

const extractJson = (text: string) => {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
};

const isAllCapsScream = (value: string) => {
  const letters = value.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 4) return false;
  return letters === letters.toUpperCase();
};

const isDistressedInput = (value: string) =>
  CURSE_PATTERNS.some((pattern) => pattern.test(value)) ||
  KEYBOARD_SLAM_PATTERNS.some((pattern) => pattern.test(value)) ||
  isAllCapsScream(value);

export async function POST(req: Request) {
  try {
    const { mood } = await req.json();

    if (!mood || typeof mood !== "string") {
      return NextResponse.json(
        { error: "Mood text is required." },
        { status: 400 }
      );
    }

    const isDistressed = isDistressedInput(mood);
    const moodForPrompt = isDistressed ? "stressed" : mood;

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        isDistressed ? applyCalmingDefaults() : fallbackSchema
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.6,
        messages: [
          {
            role: "user",
            content: PROMPT_TEMPLATE(moodForPrompt),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("OpenAI error", await response.text());
      return NextResponse.json(fallbackSchema);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(fallbackSchema);
    }

    const jsonText = extractJson(content);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      console.error("Failed to parse schema", error, jsonText);
      return NextResponse.json(fallbackSchema);
    }

    const sanitized = sanitizeSchema(parsed);
    const finalSchema = isDistressed
      ? applyCalmingDefaults(sanitized)
      : sanitized;
    return NextResponse.json(finalSchema);
  } catch (error) {
    console.error("Mood API error", error);
    return NextResponse.json(fallbackSchema);
  }
}
