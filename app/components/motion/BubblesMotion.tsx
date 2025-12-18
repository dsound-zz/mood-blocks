"use client";

import { useEffect, useRef } from "react";

type BubblesMotionProps = {
  intensity: number;
  paused?: boolean;
};

type Bubble = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wobbleAmplitude: number;
  wobbleSpeed: number;
  wobblePhase: number;
  alpha: number;
  baseX: number;
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

export default function BubblesMotion({
  intensity,
  paused = false,
}: BubblesMotionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const pausedRef = useRef(paused);
  const lastTimeRef = useRef<number>(0);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const createBubble = (): Bubble => {
      const baseRadius = 18 + intensity * 40;
      const radius = clamp(baseRadius, 12, 60) * (0.65 + Math.random() * 0.7);
      const speed =
        18 + intensity * 40 + Math.random() * (10 + intensity * 18);
      const wobbleAmplitude = 14 + Math.random() * 20;
      const wobbleSpeed = 0.65 + Math.random() * 0.85;
      const alpha = clamp(0.08 + intensity * 0.25, 0.08, 0.28);

      return {
        x: Math.random() * window.innerWidth,
        baseX: Math.random() * window.innerWidth,
        y: window.innerHeight + radius + Math.random() * window.innerHeight,
        radius,
        speed,
        wobbleAmplitude,
        wobbleSpeed,
        wobblePhase: Math.random() * Math.PI * 2,
        alpha,
      };
    };

    const bubbleCount = Math.max(12, Math.round(18 + intensity * 40));
    bubblesRef.current = Array.from({ length: bubbleCount }, createBubble);

    const render = (timestamp: number) => {
      const ctx2d = ctxRef.current;
      if (!ctx2d) return;
      if (pausedRef.current) {
        lastTimeRef.current = timestamp;
        animationRef.current = window.requestAnimationFrame(render);
        return;
      }

      const delta =
        lastTimeRef.current > 0
          ? (timestamp - lastTimeRef.current) / 1000
          : 0;
      lastTimeRef.current = timestamp;

      ctx2d.clearRect(0, 0, window.innerWidth, window.innerHeight);

      bubblesRef.current.forEach((bubble, index) => {
        bubble.y -= bubble.speed * delta * 0.85;
        bubble.wobblePhase += bubble.wobbleSpeed * delta;
        bubble.x =
          bubble.baseX + Math.sin(bubble.wobblePhase) * bubble.wobbleAmplitude;

        if (bubble.y + bubble.radius < -40) {
          bubblesRef.current[index] = createBubble();
        }

        ctx2d.beginPath();
        ctx2d.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        const gradient = ctx2d.createRadialGradient(
          bubble.x,
          bubble.y,
          bubble.radius * 0.2,
          bubble.x,
          bubble.y,
          bubble.radius
        );
        gradient.addColorStop(
          0,
          `rgba(255, 255, 255, ${bubble.alpha * 1.5})`
        );
        gradient.addColorStop(
          0.8,
          `rgba(255, 255, 255, ${bubble.alpha * 0.4})`
        );
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx2d.fillStyle = gradient;
        ctx2d.fill();
        ctx2d.closePath();
      });

      animationRef.current = window.requestAnimationFrame(render);
    };

    animationRef.current = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
      bubblesRef.current = [];
      lastTimeRef.current = 0;
      ctxRef.current = null;
    };
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
      }}
    />
  );
}
