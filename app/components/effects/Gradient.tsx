"use client";

type GradientProps = {
  intensity: number;
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

export default function Gradient({ intensity }: GradientProps) {
  const level = clamp(intensity ?? 0.5);
  const primaryOpacity = 0.25 + level * 0.35;
  const secondaryOpacity = 0.2 + level * 0.3;
  const primaryDuration = 45 - level * 20; // faster drift with higher intensity
  const secondaryDuration = 55 - level * 22;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <style>
        {`
          @keyframes gradientDriftPrimary {
            0% {
              transform: translate3d(-10%, -10%, 0) scale(1);
            }
            50% {
              transform: translate3d(5%, 10%, 0) scale(1.1);
            }
            100% {
              transform: translate3d(15%, -5%, 0) scale(1.05);
            }
          }

          @keyframes gradientDriftSecondary {
            0% {
              transform: translate3d(10%, 5%, 0) scale(1.05);
            }
            50% {
              transform: translate3d(-5%, -15%, 0) scale(1.15);
            }
            100% {
              transform: translate3d(-15%, 10%, 0) scale(1.08);
            }
          }
        `}
      </style>

      <div
        style={{
          position: "absolute",
          inset: "-20%",
          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,${primaryOpacity}), transparent 65%)`,
          filter: "blur(20px)",
          mixBlendMode: "screen",
          animation: `gradientDriftPrimary ${primaryDuration}s ease-in-out infinite alternate`,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: "-25%",
          background: `radial-gradient(circle at 70% 60%, rgba(255,255,255,${secondaryOpacity}), transparent 70%)`,
          filter: "blur(35px)",
          mixBlendMode: "screen",
          animation: `gradientDriftSecondary ${secondaryDuration}s ease-in-out infinite alternate`,
        }}
      />
    </div>
  );
}
