"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Gradient from "@/app/components/effects/Gradient";
import Splatter from "@/app/components/effects/Splatter";
import Pulse from "@/app/components/effects/Pulse";
import Haze from "@/app/components/effects/Haze";
import Particles from "@/app/components/effects/Particles";
import Ripple from "@/app/components/effects/Ripple";
import FrequencySplash from "@/app/components/FrequencySplash";
import BinauralInfoOverlay from "@/app/components/BinauralInfoOverlay";
import SoundToggle from "@/app/components/SoundToggle";
import BubblesMotion from "@/app/components/motion/BubblesMotion";
import GeometryMotion from "@/app/components/motion/GeometryMotion";
import RippleMotion from "@/app/components/motion/RippleMotion";
import { startSound, stopSound } from "@/app/utils/sound";
import type {
  MoodComponentSchema,
  NatureScene,
} from "@/app/types/schema";

type MoodRendererProps = {
  schema: MoodComponentSchema;
  onEnd: () => void;
  moodLabel?: string;
};

type MoodClassification =
  | "calm"
  | "stressed"
  | "sad"
  | "reflective"
  | "energized"
  | "playful"
  | "confused";

type ClassifiedSchema = MoodComponentSchema & {
  classification?: MoodClassification | null;
};

const getNatureAudioSources = (scene: NatureScene) => [
  `/audio/${scene}.mp3`,
  `/audio/${scene}.wav`,
  `/audio/nature/${scene}.mp3`,
];

const getNaturePhotoSources = (scene: NatureScene) => [
  `/photos/${scene}.jpg`,
  `/photos/${scene}.png`,
  `/photos/nature/${scene}.jpg`,
  `/photos/nature/${scene}.png`,
];

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

const preferBinauralSound = (
  sound?: MoodComponentSchema["sound"] | null
): MoodComponentSchema["sound"] | null => {
  if (!sound) return null;
  if (sound.type !== "sine") return sound;
  const baseBeat =
    sound.leftHz ??
    sound.rightHz ??
    sound.frequencyLeft ??
    sound.frequencyRight ??
    4;
  return {
    type: "binaural",
    leftHz: baseBeat,
    rightHz: baseBeat + 2,
    volume: Math.min(sound.volume ?? 0.35, 0.6),
  };
};

export default function MoodRenderer({
  schema,
  onEnd,
  moodLabel,
}: MoodRendererProps) {
  const { color, effect, sound: schemaSound, intensity } = schema;
  const baseSound = useMemo(() => preferBinauralSound(schemaSound), [schemaSound]);
  const classification =
    (schema as ClassifiedSchema).classification ?? null;
  const [soundOverride, setSoundOverride] = useState<
    MoodComponentSchema["sound"] | null
  >(null);
  const effectiveSound = soundOverride ?? baseSound;
  const [natureScene, setNatureScene] = useState<NatureScene | null>(
    null
  );
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [photoSourceIndex, setPhotoSourceIndex] = useState(0);
  const natureAudioRef = useRef<HTMLAudioElement | null>(null);
  const natureAudioCleanupRef = useRef<(() => void) | null>(null);
  const isNatureMode = Boolean(natureScene);
  const syntheticSound = isNatureMode ? null : effectiveSound;
  const [messageOpacity, setMessageOpacity] = useState(0);
  const isBinaural = syntheticSound?.type === "binaural";
  const leftHz =
    syntheticSound?.leftHz ??
    syntheticSound?.frequencyLeft ??
    null;
  const rightHz =
    syntheticSound?.rightHz ??
    syntheticSound?.frequencyRight ??
    null;
  const beatHz =
    leftHz != null && rightHz != null ? Math.abs(rightHz - leftHz) : null;
  const [overlayMode, setOverlayMode] = useState<
    "hidden" | "initial" | "reminder"
  >("hidden");
  const binauralSignature = isBinaural
    ? [
        syntheticSound?.leftHz ??
          syntheticSound?.frequencyLeft ??
          "x",
        syntheticSound?.rightHz ??
          syntheticSound?.frequencyRight ??
          "y",
      ].join("-")
    : null;

  const stopNatureAudio = useCallback(() => {
    if (natureAudioCleanupRef.current) {
      natureAudioCleanupRef.current();
      natureAudioCleanupRef.current = null;
    }
    const audio = natureAudioRef.current;
    if (audio) {
      try {
        audio.pause();
      } catch {
        /* ignore */
      }
      try {
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
      audio.src = "";
    }
    natureAudioRef.current = null;
  }, []);

  const startNatureAudio = useCallback(
    (scene: NatureScene) => {
      if (typeof window === "undefined") return;
      stopNatureAudio();
      const audio = new Audio();
      audio.loop = true;
      audio.volume = clamp(0.45 + intensity * 0.35, 0.3, 0.85);
      const sources = getNatureAudioSources(scene);
      let sourceIndex = 0;

      const tryStart = () => {
        if (sourceIndex >= sources.length) return;
        audio.src = sources[sourceIndex];
        audio.load();
        const attempt = audio.play();
        if (attempt && typeof attempt.then === "function") {
          attempt.catch(() => {
            /* ignore autoplay blocks */
          });
        }
      };

      const handleError = () => {
        sourceIndex += 1;
        if (sourceIndex < sources.length) {
          tryStart();
        }
      };

      audio.addEventListener("error", handleError);
      natureAudioCleanupRef.current = () => {
        audio.removeEventListener("error", handleError);
      };
      natureAudioRef.current = audio;
      tryStart();
    },
    [intensity, stopNatureAudio]
  );

  useEffect(() => {
    return () => {
      stopNatureAudio();
    };
  }, [stopNatureAudio]);

  useEffect(() => {
    stopNatureAudio();
    if (typeof window === "undefined") {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setNatureScene(null);
      setPhotoSourceIndex(0);
      setPhotoLoaded(false);
      setSoundOverride(null);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [schema, stopNatureAudio]);

  useEffect(() => {
    const config = baseSound ? { ...baseSound, classification } : baseSound;
    void startSound(config);
    return () => {
      stopSound();
    };
  }, [baseSound, classification]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!schema.message) {
      const hideId = window.setTimeout(() => {
        setMessageOpacity(0);
      }, 0);
      return () => {
        window.clearTimeout(hideId);
      };
    }

    const showId = window.setTimeout(() => {
      setMessageOpacity(1);
    }, 0);

    const hideId = window.setTimeout(() => {
      setMessageOpacity(0);
    }, 7000);

    return () => {
      window.clearTimeout(showId);
      window.clearTimeout(hideId);
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
    if (baseSound && selected === baseSound.type) {
      return null;
    }

    const baseVolume = baseSound?.volume ?? 0.35;
    if (selected === "none") {
      return { type: "none", volume: 0 };
    }

    if (selected === "sine") {
      const freq =
        baseSound?.leftHz ??
        baseSound?.rightHz ??
        baseSound?.frequencyLeft ??
        baseSound?.frequencyRight ??
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
        baseSound?.leftHz ??
        baseSound?.frequencyLeft ??
        4;
      const right =
        baseSound?.rightHz ??
        baseSound?.frequencyRight ??
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
    stopNatureAudio();
    setNatureScene(null);
    setPhotoSourceIndex(0);
    setPhotoLoaded(false);
    const overrideConfig = buildSoundOverride(selected);
    setSoundOverride(overrideConfig);
    stopSound();
    const nextSound = overrideConfig ?? baseSound;
    const config = nextSound
      ? { ...nextSound, classification }
      : nextSound;
    void startSound(config);
  };

  const handleNatureSelect = (scene: NatureScene) => {
    setNatureScene(scene);
    setPhotoSourceIndex(0);
    setPhotoLoaded(false);
    stopSound();
    startNatureAudio(scene);
  };

  const handleEnd = () => {
    setSoundOverride(null);
    setNatureScene(null);
    setPhotoSourceIndex(0);
    setPhotoLoaded(false);
    stopNatureAudio();
    stopSound();
    onEnd();
  };

  const photoSources = natureScene
    ? getNaturePhotoSources(natureScene)
    : [];
  const currentPhotoSrc = photoSources[photoSourceIndex] ?? null;
  const photoOpacity =
    isNatureMode && currentPhotoSrc && photoLoaded ? 1 : 0;
  const motionSetting = schema.motion ?? "bubbles";
  const motionEnabled = motionSetting !== "none";
  const motionActive = motionEnabled && !isNatureMode;
  const motionOpacity = motionActive ? 1 : 0;
  const motionPaused = !motionActive;
  const backgroundOpacity = isNatureMode
    ? photoLoaded && currentPhotoSrc
      ? 0
      : 1
    : 1;

  const handlePhotoLoad = () => {
    setPhotoLoaded(true);
  };

  const handlePhotoError = () => {
    if (!natureScene) return;
    setPhotoLoaded(false);
    setPhotoSourceIndex((index) => {
      const sources = getNaturePhotoSources(natureScene);
      if (index < sources.length - 1) {
        return index + 1;
      }
      return sources.length;
    });
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
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: backgroundOpacity,
          transition: "opacity 650ms ease",
          zIndex: 0,
        }}
      >
        {effect === "gradient" && <Gradient intensity={intensity} />}
        {effect === "splatter" && <Splatter intensity={intensity} />}
        {effect === "pulse" && (
          <Pulse intensity={intensity} color={color} />
        )}
        {effect === "haze" && <Haze intensity={intensity} color={color} />}
        {effect === "particles" && <Particles intensity={intensity} />}
        {effect === "ripple" && (
          <Ripple intensity={intensity} color={color} />
        )}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: photoOpacity,
          transition: "opacity 750ms ease",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        {natureScene && currentPhotoSrc && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhotoSrc}
              alt={`${natureScene} backdrop`}
              onLoad={handlePhotoLoad}
              onError={handlePhotoError}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.92) saturate(0.9)",
                transition: "transform 12s ease",
                transform: photoLoaded ? "scale(1)" : "scale(1.05)",
              }}
            />
          </>
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(2,6,23,0.4) 100%)",
          }}
        />
      </div>

      {motionEnabled && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            opacity: motionOpacity,
            transition: "opacity 650ms ease",
          }}
        >
          {motionSetting === "bubbles" && (
            <BubblesMotion intensity={intensity} paused={motionPaused} />
          )}
          {motionSetting === "geometry" && (
            <GeometryMotion intensity={intensity} paused={motionPaused} />
          )}
          {motionSetting === "ripples" && (
            <RippleMotion intensity={intensity} paused={motionPaused} />
          )}
        </div>
      )}

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

      <FrequencySplash sound={syntheticSound ?? undefined} moodLabel={moodLabel} />
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
          zIndex: 5,
        }}
      >
        <SoundToggle
          currentSound={effectiveSound?.type ?? "none"}
          currentNature={natureScene}
          recommendedNature={schema.nature?.scene}
          onSoundChange={handleSoundChange}
          onNatureChange={handleNatureSelect}
        />
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 4,
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
