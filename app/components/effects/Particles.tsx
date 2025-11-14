"use client";

type ParticlesProps = {
  intensity: number;
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

export default function Particles({ intensity }: ParticlesProps) {
  const level = clamp(intensity ?? 0.5);
  const count = Math.floor(25 + level * 50);

  const particles = Array.from({ length: count }, (_, index) => {
    const base = (index * 37) % 100;
    const size = 2 + ((index * 7) % 4);
    const delay = (index % 6) * 0.4;
    const duration = 5 - level * 1.5 + ((index % 5) * 0.25);
    const opacity = 0.25 + ((index % 10) * 0.05);

    return {
      left: `${base}%`,
      size,
      delay,
      duration,
      opacity: Math.min(opacity, 0.8),
    };
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      <style>
        {`
          @keyframes floatUp {
            0% {
              transform: translate3d(0, 30%, 0);
              opacity: 0;
            }
            20% {
              opacity: 1;
            }
            80% {
              opacity: 1;
            }
            100% {
              transform: translate3d(0, -120%, 0);
              opacity: 0;
            }
          }
        `}
      </style>
      {particles.map((particle, index) => (
        <span
          key={index}
          style={{
            position: "absolute",
            bottom: "-20%",
            left: particle.left,
            width: particle.size,
            height: particle.size * 1.5,
            borderRadius: "999px",
            background: "rgba(255,255,255,0.9)",
            opacity: particle.opacity,
            filter: "blur(0.5px)",
            animation: `floatUp ${particle.duration}s linear ${particle.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
