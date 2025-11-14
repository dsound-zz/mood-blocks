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
import SoundToggle from "@/app/components/SoundToggle";
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
  const { color, effect, sound: schemaSound, intensity } = schema;
  const [soundOverride, setSoundOverride] = useState<
    MoodComponentSchema["sound"] | null
  >(null);
  const effectiveSound = soundOverride ?? schemaSound;
  const [messageOpacity, setMessageOpacity] = useState(0);
  const isBinaural = effectiveSound?.type === "binaural";
  const leftHz =
    effectiveSound?.leftHz ??
    effectiveSound?.frequencyLeft ??
    null;
  const rightHz =
    effectiveSound?.rightHz ??
    effectiveSound?.frequencyRight ??
    null;
  const beatHz =
    leftHz != null && rightHz != null ? Math.abs(rightHz - leftHz) : null;
  const [overlayMode, setOverlayMode] = useState<
    "hidden" | "initial" | "reminder"
  >("hidden");
  const binauralSignature = isBinaural
    ? [
        effectiveSound?.leftHz ??
          effectiveSound?.frequencyLeft ??
          "x",
        effectiveSound?.rightHz ??
          effectiveSound?.frequencyRight ??
          "y",
      ].join("-")
    : null;

  useEffect(() => {
    void startSound(schemaSound);
    return () => {
      stopSound();
    };
  }, [schemaSound]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!schema.message) {
      setMessageOpacity(0);
      return;
    }
    setMessageOpacity(1);
    const fadeOut = window.setTimeout(() => {
      setMessageOpacity(0);
    }, 7000);
    return () => {
      window.clearTimeout(fadeOut);
    };
  }, [schema.message]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isBinaural) {
      window.setTimeout(() => setOverlayMode("hidden"), 0);
      return;
    }

    window.setTimeout(() => setOverlayMode("initial"), 0);
    let reminderHide: number | undefined;

    const hideOverlay = () => setOverlayMode("hidden");

    const hideInitial = window.setTimeout(hideOverlay, 4000);

    const triggerReminder = () => {
      setOverlayMode("reminder");
      window.clearTimeout(reminderHide);
      reminderHide = window.setTimeout(hideOverlay, 3000);
    };

    const reminderInterval = window.setInterval(triggerReminder, 15000);

    return () => {
      window.clearTimeout(hideInitial);
      window.clearTimeout(reminderHide);
      window.clearInterval(reminderInterval);
    };
  }, [isBinaural, binauralSignature]);

  const buildSoundOverride = (
    selected: MoodComponentSchema["sound"]["type"]
  ): MoodComponentSchema["sound"] | null => {
    if (schemaSound && selected === schemaSound.type) {
      return null;
    }

    const baseVolume = schemaSound?.volume ?? 0.35;
    if (selected === "none") {
      return { type: "none", volume: 0 };
    }

    if (selected === "sine") {
      const freq =
        schemaSound?.leftHz ??
        schemaSound?.rightHz ??
        schemaSound?.frequencyLeft ??
        schemaSound?.frequencyRight ??
        432;
      return {
        type: "sine",
        leftHz: freq,
        rightHz: freq,
        volume: Math.min(baseVolume, 0.5),
      };
    }

    if (selected === "binaural") {
      const left =
        schemaSound?.leftHz ??
        schemaSound?.frequencyLeft ??
        4;
      const right =
        schemaSound?.rightHz ??
        schemaSound?.frequencyRight ??
        left + 2;
      return {
        type: "binaural",
        leftHz: left,
        rightHz: right,
        volume: Math.min(baseVolume + 0.05, 0.6),
      };
    }

    return {
      type: selected,
      volume: Math.min(baseVolume, 0.35),
    };
  };

  const handleSoundChange = (
    selected: MoodComponentSchema["sound"]["type"]
  ) => {
    const overrideConfig = buildSoundOverride(selected);
    setSoundOverride(overrideConfig);
    stopSound();
    void startSound(overrideConfig ?? schemaSound);
  };

  const handleEnd = () => {
    setSoundOverride(null);
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
      {effect === "pulse" && <Pulse intensity={intensity} color={color} />}
      {effect === "haze" && <Haze intensity={intensity} color={color} />}
      {effect === "particles" && <Particles intensity={intensity} />}
      {effect === "ripple" && <Ripple intensity={intensity} color={color} />}

      {schema.message && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 3,
            background: "rgba(2,6,23,0.75)",
            borderRadius: "1.5rem",
            padding: "1.25rem 2rem",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#f8fafc",
            fontSize: "2rem",
            fontWeight: 600,
            letterSpacing: "0.03em",
            textAlign: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            backdropFilter: "blur(12px)",
            opacity: messageOpacity,
            transition: "opacity 1.5s ease-in-out",
          }}
        >
          {schema.message}
        </div>
      )}

      <FrequencySplash sound={effectiveSound} moodLabel={moodLabel} />
      <BinauralInfoOverlay
        mode={isBinaural ? overlayMode : "hidden"}
        beatHz={beatHz}
        isBinaural={isBinaural}
      />

      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          right: "2rem",
          zIndex: 2,
        }}
      >
        <SoundToggle
          current={effectiveSound?.type ?? "none"}
          onChange={handleSoundChange}
        />
      </div>

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
