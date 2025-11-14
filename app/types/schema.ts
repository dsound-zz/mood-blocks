export type SoundType =
  | "none"
  | "sine"
  | "binaural"
  | "white_noise"
  | "pink_noise"
  | "brown_noise"
  | "blue_noise";

export type MoodComponentSchema = {
  type: "mood_display";
  color: string;
  effect:
    | "gradient"
    | "splatter"
    | "pulse"
    | "haze"
    | "particles"
    | "ripple";
  intensity: number;
  sound: {
    type: SoundType;
    leftHz?: number;
    rightHz?: number;
    volume?: number;
    /** Legacy support for old schema keys */
    frequencyLeft?: number;
    frequencyRight?: number;
  };
  message?: string;
};
