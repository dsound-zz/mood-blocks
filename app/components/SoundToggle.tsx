"use client";

import { useEffect, useRef, useState } from "react";
import type {
  MoodComponentSchema,
  NatureScene,
} from "@/app/types/schema";

type SoundToggleProps = {
  currentSound?: MoodComponentSchema["sound"]["type"];
  currentNature?: NatureScene | null;
  recommendedNature?: NatureScene | null;
  onSoundChange: (type: MoodComponentSchema["sound"]["type"]) => void;
  onNatureChange: (scene: NatureScene) => void;
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

const NATURE_OPTIONS: NatureScene[] = [
  "rain",
  "ocean",
  "forest",
  "wind",
  "fire",
  "night",
  "river",
  "birds",
];

const NATURE_LABELS: Record<NatureScene, string> = {
  rain: "Rain",
  ocean: "Ocean",
  forest: "Forest",
  wind: "Wind",
  fire: "Fire",
  night: "Night",
  river: "River",
  birds: "Birds",
};

export default function SoundToggle({
  currentSound = "none",
  currentNature = null,
  recommendedNature = null,
  onSoundChange,
  onNatureChange,
}: SoundToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllNature, setShowAllNature] = useState(false);
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

  useEffect(() => {
    if (isOpen) return;
    if (typeof window === "undefined") return;
    const frame = window.requestAnimationFrame(() => {
      setShowAllNature(false);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isOpen]);

  const handleSelectSound = (
    option: MoodComponentSchema["sound"]["type"]
  ) => {
    onSoundChange(option);
    setIsOpen(false);
  };

  const handleSelectNature = (scene: NatureScene) => {
    onNatureChange(scene);
    setIsOpen(false);
  };

  const currentLabel = currentNature
    ? `Nature · ${NATURE_LABELS[currentNature]}`
    : SOUND_LABELS[currentSound ?? "none"] ?? "Muted";
  const recommendedScene = recommendedNature ?? null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        fontSize: "0.85rem",
        width: "100%",
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
          padding: "0.75rem 1.5rem",
          cursor: "pointer",
          fontSize: "1rem",
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          width: "100%",
          display: "inline-flex",
          justifyContent: "center",
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
          <div
            style={{
              padding: "0.35rem 0.85rem",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Synthetic
          </div>
          {SOUND_OPTIONS.map((option) => {
            const isSelected = !currentNature && option === currentSound;
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSelectSound(option)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.55rem 0.85rem",
                  background: isSelected
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
            );
          })}
          <div
            style={{
              padding: "0.35rem 0.85rem",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              marginTop: "0.25rem",
            }}
          >
            Nature
          </div>
          {recommendedScene && (
            <button
              type="button"
              onClick={() => handleSelectNature(recommendedScene)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                textAlign: "left",
                padding: "0.6rem 0.85rem",
                background:
                  currentNature === recommendedScene
                    ? "rgba(129,140,248,0.35)"
                    : "rgba(255,255,255,0.05)",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "0.88rem",
                gap: "0.5rem",
              }}
            >
              <span>
                Recommended · {NATURE_LABELS[recommendedScene]}
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                Calmest Match
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAllNature((value) => !value)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "0.5rem 0.85rem",
              background: "transparent",
              color: "rgba(255,255,255,0.75)",
              border: "none",
              cursor: "pointer",
              fontSize: "0.8rem",
              letterSpacing: "0.04em",
            }}
          >
            {showAllNature ? "Hide all nature" : "Show all nature"}
          </button>
          {(showAllNature || !recommendedScene) &&
            NATURE_OPTIONS.filter(
              (scene) => scene !== recommendedScene
            ).map((scene) => {
              const isSelected = currentNature === scene;
              return (
                <button
                  key={scene}
                  type="button"
                  onClick={() => handleSelectNature(scene)}
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "left",
                    padding: "0.55rem 0.85rem",
                    background: isSelected
                      ? "rgba(99,102,241,0.25)"
                      : "transparent",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    gap: "0.5rem",
                  }}
                >
                  <span>{NATURE_LABELS[scene]}</span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
