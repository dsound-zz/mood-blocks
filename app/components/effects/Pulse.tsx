"use client";

type PulseProps = {
  intensity: number;
  color: string;
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

export default function Pulse({ intensity, color }: PulseProps) {
  const level = clamp(intensity ?? 0.5);
  const duration = 12 - level * 6; // 12s down to 6s
  const opacity = 0.2 + level * 0.6;

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
          @keyframes pulseBreath {
            0% {
              transform: scale(0.9);
              opacity: ${opacity * 0.7};
            }
            50% {
              transform: scale(1.1);
              opacity: ${opacity};
            }
            100% {
              transform: scale(0.9);
              opacity: ${opacity * 0.7};
            }
          }
        `}
      </style>
      <div
        style={{
          width: "60vmin",
          height: "60vmin",
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,255,255,0.2), ${color})`,
          filter: "blur(10px)",
          animation: `pulseBreath ${duration}s ease-in-out infinite`,
        }}
      />
    </div>
  );
}
