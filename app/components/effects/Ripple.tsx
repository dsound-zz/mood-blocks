"use client";

type RippleProps = {
  intensity: number;
  color: string;
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

export default function Ripple({ intensity, color }: RippleProps) {
  const level = clamp(intensity ?? 0.5);
  const count = 4;
  const duration = 14 - level * 6;
  const opacity = 0.15 + level * 0.3;

  const ripples = Array.from({ length: count });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <style>
        {`
          @keyframes rippleExpand {
            0% {
              transform: scale(0.3);
              opacity: ${opacity};
            }
            70% {
              opacity: ${opacity * 0.8};
            }
            100% {
              transform: scale(1);
              opacity: 0;
            }
          }
        `}
      </style>
      {ripples.map((_, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            width: `${40 + index * 15}vmin`,
            height: `${40 + index * 15}vmin`,
            borderRadius: "50%",
            border: `2px solid rgba(255,255,255,${Math.max(
              0.05,
              0.4 - index * 0.07
            )})`,
            background: "radial-gradient(circle, rgba(255,255,255,0.08), transparent)",
            animation: `rippleExpand ${duration}s ease-out infinite`,
            animationDelay: `${index * (duration / count)}s`,
          }}
        />
      ))}
    </div>
  );
}
