"use client";

import { useEffect } from "react";
// import { startSound, stopSound } from "../utils/sound";
import Splatter from "@/app/components/effects/Splatter";
// import Gradient from ".effects/Gradient";
// import Pulse from "./effects/Pulse";
// import Haze from "./effects/Haze";

export default function MoodRenderer({ schema }) {
  const { color, effect, sound, intensity } = schema;
  //
  // 1. AUDIO — starts/stops whenever "sound" changes
  //
  //   useEffect(() => {
  //     startSound(sound);
  //     return () => stopSound();
  //   }, [sound]);

  //
  // 2. VISUAL — background + effect
  //
  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        background: color,
        transition: "background 0.5s ease",
      }}
    >
      {effect === "splatter" && <Splatter intensity={intensity} />}
      {effect === "gradient" && <Gradient intensity={intensity} />}
      {effect === "pulse" && <Pulse intensity={intensity} />}
      {effect === "haze" && <Haze intensity={intensity} />}
    </div>
  );
}
