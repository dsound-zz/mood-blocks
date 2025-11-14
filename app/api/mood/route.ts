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

  const soundType =
    data?.sound?.type === "sine" || data?.sound?.type === "binaural"
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

const extractJson = (text: string) => {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
};

export async function POST(req: Request) {
  try {
    const { mood } = await req.json();

    if (!mood || typeof mood !== "string") {
      return NextResponse.json(
        { error: "Mood text is required." },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(fallbackSchema);
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
            content: PROMPT_TEMPLATE(mood),
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
    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Mood API error", error);
    return NextResponse.json(fallbackSchema);
  }
}
