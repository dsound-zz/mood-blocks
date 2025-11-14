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
    frequencyLeft?: number;
    frequencyRight?: number;
    volume?: number;
  };
};
