"use client";

import { useEffect, useMemo, useState } from "react";
import type { MoodComponentSchema } from "@/app/types/schema";

type FrequencySplashProps = {
  sound?: MoodComponentSchema["sound"];
  moodLabel?: string;
};

const DISPLAY_DURATION_MS = 15000;
const RETURN_DELAY_MS = 22000;

const resolveHz = (value?: number | null) =>
  typeof value === "number" && !Number.isNaN(value) ? value : undefined;

const formatSplashLabel = (
  sound?: MoodComponentSchema["sound"],
  moodLabel?: string
) => {
  const segments: string[] = [];

  if (moodLabel?.trim()) {
    segments.push(moodLabel.trim());
  }

  if (!sound || sound.type === "none") {
    return segments.join(" • ");
  }

  const formatHz = (value?: number) =>
    typeof value === "number" ? `${Math.round(value)} Hz` : undefined;

  const leftHz =
    resolveHz(sound.leftHz) ?? resolveHz(sound.frequencyLeft);
  const rightHz =
    resolveHz(sound.rightHz) ?? resolveHz(sound.frequencyRight);

  if (sound.type === "sine") {
    const freq = formatHz(leftHz ?? 432);
    segments.push([freq, "Sine"].filter(Boolean).join(" "));
  } else if (sound.type === "binaural") {
    const left = formatHz(leftHz ?? 4);
    const right = formatHz(rightHz ?? (leftHz ?? 6));
    const freqs = [left, right].filter(Boolean).join(" / ");
    segments.push([freqs, "Binaural"].filter(Boolean).join(" "));
  }

  return segments.join(" • ");
};

export default function FrequencySplash({
  sound,
  moodLabel,
}: FrequencySplashProps) {
  const splashLabel = useMemo(
    () => formatSplashLabel(sound, moodLabel),
    [sound, moodLabel]
  );
  const [isVisible, setIsVisible] = useState(Boolean(splashLabel));
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    if (!splashLabel) {
      if (typeof window === "undefined") {
        return;
      }
      const frame = window.requestAnimationFrame(() => {
        setIsVisible(false);
      });
      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    let hideTimeout: number | undefined;
    const runCycle = () => {
      setCycleKey((key) => key + 1);
      setIsVisible(true);

      window.clearTimeout(hideTimeout);
      hideTimeout = window.setTimeout(() => {
        setIsVisible(false);
      }, DISPLAY_DURATION_MS);
    };

    runCycle();
    const intervalId = window.setInterval(runCycle, RETURN_DELAY_MS);

    return () => {
      window.clearTimeout(hideTimeout);
      window.clearInterval(intervalId);
    };
  }, [splashLabel]);

  if (!splashLabel || !isVisible) {
    return null;
  }

  return (
    <div className="frequency-splash" key={cycleKey}>
      <div className="frequency-splash__content">
        <span className="frequency-splash__label">{splashLabel}</span>
      </div>
    </div>
  );
}
