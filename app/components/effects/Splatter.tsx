"use client";

import { useEffect, useRef } from "react";

type SplatterProps = {
  intensity: number;
};

export default function Splatter({ intensity }: SplatterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const level = Math.min(Math.max(intensity ?? 0.5, 0), 1);
    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);

    ctx.clearRect(0, 0, w, h);

    const blobs = Math.floor(5 + level * 30);

    for (let i = 0; i < blobs; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 120 * level + 25;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      ctx.fill();
    }
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
