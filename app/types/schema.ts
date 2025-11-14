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
    type: "none" | "sine" | "binaural";
    leftHz?: number;
    rightHz?: number;
    volume?: number;
    /** Legacy support for old schema keys */
    frequencyLeft?: number;
    frequencyRight?: number;
  };
};
