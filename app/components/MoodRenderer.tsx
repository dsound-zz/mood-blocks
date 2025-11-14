"use client";

import { useEffect, useState } from "react";
import Gradient from "@/app/components/effects/Gradient";
import Splatter from "@/app/components/effects/Splatter";
import Pulse from "@/app/components/effects/Pulse";
import Haze from "@/app/components/effects/Haze";
import Particles from "@/app/components/effects/Particles";
import Ripple from "@/app/components/effects/Ripple";
import FrequencySplash from "@/app/components/FrequencySplash";
import BinauralInfoOverlay from "@/app/components/BinauralInfoOverlay";
import { startSound, stopSound } from "@/app/utils/sound";
import type { MoodComponentSchema } from "@/app/types/schema";

type MoodRendererProps = {
  schema: MoodComponentSchema;
  onEnd: () => void;
  moodLabel?: string;
};

export default function MoodRenderer({
  schema,
  onEnd,
  moodLabel,
}: MoodRendererProps) {
  const { color, effect, sound, intensity } = schema;
  const isBinaural = sound?.type === "binaural";
  const leftHz =
    sound?.leftHz ??
    sound?.frequencyLeft ??
    null;
  const rightHz =
    sound?.rightHz ??
    sound?.frequencyRight ??
    null;
  const beatHz =
    leftHz != null && rightHz != null ? Math.abs(rightHz - leftHz) : null;
  const [overlayMode, setOverlayMode] = useState<
    "hidden" | "initial" | "reminder"
  >("hidden");

  useEffect(() => {
    void startSound(sound);
    return () => {
      stopSound();
    };
  }, [sound]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isBinaural) {
      setOverlayMode("hidden");
      return;
    }

    setOverlayMode("initial");
    let hideInitial: number | undefined;
    let reminderHide: number | undefined;
    let reminderInterval: number | undefined;

    const hideOverlay = () => setOverlayMode("hidden");

    hideInitial = window.setTimeout(hideOverlay, 4000);

    const triggerReminder = () => {
      setOverlayMode("reminder");
      window.clearTimeout(reminderHide);
      reminderHide = window.setTimeout(hideOverlay, 3000);
    };

    reminderInterval = window.setInterval(triggerReminder, 15000);

    return () => {
      window.clearTimeout(hideInitial);
      window.clearTimeout(reminderHide);
      window.clearInterval(reminderInterval);
    };
  }, [isBinaural]);

  const handleEnd = () => {
    stopSound();
    onEnd();
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: color,
        transition: "background 0.5s ease",
      }}
    >
      {effect === "gradient" && <Gradient intensity={intensity} />}
      {effect === "splatter" && <Splatter intensity={intensity} />}
      {effect === "pulse" && (
        <Pulse intensity={intensity} color={color} />
      )}
      {effect === "haze" && <Haze intensity={intensity} color={color} />}
      {effect === "particles" && <Particles intensity={intensity} />}
      {effect === "ripple" && <Ripple intensity={intensity} color={color} />}

      <FrequencySplash sound={sound} moodLabel={moodLabel} />
      <BinauralInfoOverlay
        mode={isBinaural ? overlayMode : "hidden"}
        beatHz={beatHz}
        isBinaural={isBinaural}
      />

      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1,
        }}
      >
        <button
          onClick={handleEnd}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "999px",
            border: "none",
            background: "rgba(255, 255, 255, 0.85)",
            color: "#111",
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          }}
        >
          End
        </button>
      </div>
    </div>
  );
}
