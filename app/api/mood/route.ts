import { NextResponse } from "next/server";
import type { MoodComponentSchema } from "@/app/types/schema";

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

const sanitizeSchema = (data: any): MoodComponentSchema => {
  const effect = EFFECTS.includes(data?.effect)
    ? data.effect
    : "gradient";

  const soundType = SOUND_TYPES.includes(data?.sound?.type)
    ? data.sound.type
    : "none";

  const parseHz = (value: unknown) =>
    typeof value === "number" ? value : undefined;

  return {
    type: "mood_display",
    color: typeof data?.color === "string" ? data.color : "#0f172a",
    effect,
    intensity: clamp(
      typeof data?.intensity === "number" ? data.intensity : 0.5
    ),
    sound: {
      type: soundType,
      leftHz:
        parseHz(data?.sound?.leftHz) ??
        parseHz(data?.sound?.frequencyLeft),
      rightHz:
        parseHz(data?.sound?.rightHz) ??
        parseHz(data?.sound?.frequencyRight),
      volume:
        typeof data?.sound?.volume === "number"
          ? clamp(data.sound.volume)
          : 0.3,
    },
    message: typeof data?.message === "string" ? data.message : undefined,
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
