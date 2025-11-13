"use client";

import { useEffect, useRef } from "react";

export default function Splatter({ intensity }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);

    ctx.clearRect(0, 0, w, h);

    const blobs = Math.floor(20 * intensity + 5);

    for (let i = 0; i < blobs; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 100 * intensity + 20;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fill();
    }
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    />
  );
}
