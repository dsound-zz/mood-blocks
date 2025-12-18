"use client";

import { useEffect, useRef } from "react";

type RippleMotionProps = {
  intensity: number;
  paused?: boolean;
};

type Ripple = {
  radius: number;
  speed: number;
  lineWidth: number;
  delay: number;
  elapsed: number;
  opacity: number;
};

export default function RippleMotion({
  intensity,
  paused = false,
}: RippleMotionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();
  const ripplesRef = useRef<Ripple[]>([]);
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

    const createRipple = (delay: number): Ripple => ({
      radius: 0,
      speed: 26 + intensity * 32,
      lineWidth: 1.6 + intensity * 1.1,
      delay,
      elapsed: 0,
      opacity: 0.2 + intensity * 0.2,
    });

    const rippleCount = 4;
    const rippleSpacing = 1.8;
    ripplesRef.current = Array.from({ length: rippleCount }, (_, index) =>
      createRipple(index * rippleSpacing)
    );

    const render = (timestamp: number) => {
      const context = ctxRef.current;
      if (!context) return;
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

      const width = window.innerWidth;
      const height = window.innerHeight;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.max(width, height) * 0.75;

      context.clearRect(0, 0, width, height);

      ripplesRef.current.forEach((ripple) => {
        ripple.elapsed += delta;
        if (ripple.elapsed < ripple.delay) {
          return;
        }

        ripple.radius += ripple.speed * delta * 0.7;

        const progress = ripple.radius / maxRadius;
        const opacity = Math.max(0, ripple.opacity * (1 - progress));

        if (progress >= 1) {
          ripple.radius = 0;
          ripple.elapsed = 0;
          return;
        }

        context.beginPath();
        context.arc(centerX, centerY, ripple.radius, 0, Math.PI * 2);
        context.strokeStyle = `rgba(255,255,255,${opacity})`;
        context.lineWidth = ripple.lineWidth;
        context.stroke();
      });

      animationRef.current = window.requestAnimationFrame(render);
    };

    animationRef.current = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
      ripplesRef.current = [];
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
