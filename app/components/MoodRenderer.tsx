"use client";

import { useEffect } from "react";
import Gradient from "@/app/components/effects/Gradient";
import Splatter from "@/app/components/effects/Splatter";
import Pulse from "@/app/components/effects/Pulse";
import Haze from "@/app/components/effects/Haze";
import Particles from "@/app/components/effects/Particles";
import Ripple from "@/app/components/effects/Ripple";
import { startSound, stopSound } from "@/app/utils/sound";
import type { MoodComponentSchema } from "@/app/types/schema";

type MoodRendererProps = {
  schema: MoodComponentSchema;
  onEnd: () => void;
};

export default function MoodRenderer({ schema, onEnd }: MoodRendererProps) {
  const { color, effect, sound, intensity } = schema;

  useEffect(() => {
    void startSound(sound);
    return () => {
      stopSound();
    };
  }, [sound]);

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
