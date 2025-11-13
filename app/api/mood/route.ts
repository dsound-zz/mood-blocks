import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { mood } = await req.json();

  const mockSchema = {
    type: "mood_display",
    color: "#6AB3F2",
    effect: "splatter",
    intensity: 0.5,
    sound: {
      type: "sine",
      frequencyLeft: 432,
      volume: 0.5,
    },
    _debug: `Mocked response for mood: ${mood}`,
  };

  return NextResponse.json(mockSchema);
}
