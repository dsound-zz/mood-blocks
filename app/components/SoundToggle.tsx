"use client";

import { useEffect, useRef, useState } from "react";
import type { MoodComponentSchema } from "@/app/types/schema";

type SoundToggleProps = {
  current?: MoodComponentSchema["sound"]["type"];
  onChange: (type: MoodComponentSchema["sound"]["type"]) => void;
};

const SOUND_OPTIONS: MoodComponentSchema["sound"]["type"][] = [
  "sine",
  "binaural",
  "white_noise",
  "pink_noise",
  "brown_noise",
  "blue_noise",
  "none",
];

const SOUND_LABELS: Record<MoodComponentSchema["sound"]["type"], string> = {
  sine: "Sine",
  binaural: "Binaural",
  white_noise: "White Noise",
  pink_noise: "Pink Noise",
  brown_noise: "Brown Noise",
  blue_noise: "Blue Noise",
  none: "Muted",
};

export default function SoundToggle({
  current = "none",
  onChange,
}: SoundToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const handleSelect = (
    option: MoodComponentSchema["sound"]["type"]
  ) => {
    onChange(option);
    setIsOpen(false);
  };

  const currentLabel = SOUND_LABELS[current] ?? current;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        fontSize: "0.85rem",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        style={{
          background: "rgba(2,6,23,0.75)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "999px",
          padding: "0.45rem 1rem",
          cursor: "pointer",
          fontSize: "0.85rem",
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
        }}
      >
        Sound: {currentLabel}
      </button>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 0.5rem)",
            right: 0,
            background: "rgba(2,6,23,0.85)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "0.75rem",
            boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
            overflow: "hidden",
            minWidth: "160px",
            backdropFilter: "blur(6px)",
          }}
        >
          {SOUND_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "0.55rem 0.85rem",
                background:
                  option === current
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              {SOUND_LABELS[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
