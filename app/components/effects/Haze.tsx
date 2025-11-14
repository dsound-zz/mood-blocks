"use client";

type HazeProps = {
  intensity: number;
  color: string;
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

const blobPositions = [
  { top: "-10%", left: "10%" },
  { top: "20%", right: "-5%" },
  { bottom: "-15%", left: "25%" },
  { top: "40%", left: "50%" },
];

export default function Haze({ intensity, color }: HazeProps) {
  const level = clamp(intensity ?? 0.5);
  const opacity = 0.15 + level * 0.35;
  const duration = 50 - level * 20;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <style>
        {`
          @keyframes hazeDrift {
            0% {
              transform: translate3d(0, 0, 0) scale(1);
            }
            50% {
              transform: translate3d(5%, -5%, 0) scale(1.05);
            }
            100% {
              transform: translate3d(-3%, 4%, 0) scale(1.02);
            }
          }
        `}
      </style>
      {blobPositions.map((pos, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            width: `${40 + level * 30}vmin`,
            height: `${40 + level * 30}vmin`,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(255,255,255,${
              opacity * 0.6
            }), ${color})`,
            filter: "blur(60px)",
            mixBlendMode: "screen",
            opacity: opacity,
            animation: `hazeDrift ${duration + index * 5}s ease-in-out infinite alternate`,
            ...pos,
          }}
        />
      ))}
    </div>
  );
}
