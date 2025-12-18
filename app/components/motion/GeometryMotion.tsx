"use client";

import { useEffect, useRef } from "react";

type GeometryMotionProps = {
  intensity: number;
  paused?: boolean;
};

type ShapeType = "circle" | "triangle" | "hexagon";

type Shape = {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  driftX: number;
  driftY: number;
  opacity: number;
  type: ShapeType;
};

const SHAPE_TYPES: ShapeType[] = ["circle", "triangle", "hexagon"];

export default function GeometryMotion({
  intensity,
  paused = false,
}: GeometryMotionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();
  const shapesRef = useRef<Shape[]>([]);
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

    const createShape = (): Shape => {
      const size = 40 + Math.random() * 80 * (0.6 + intensity);
      const rotationSpeed =
        (0.12 + Math.random() * 0.25) *
        (Math.random() > 0.5 ? 1 : -1);
      const driftMagnitude = 10 + intensity * 18;
      const angle = Math.random() * Math.PI * 2;
      const opacity = 0.08 + Math.random() * 0.12;
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed,
        driftX: Math.cos(angle) * driftMagnitude,
        driftY: Math.sin(angle) * driftMagnitude,
        opacity,
        type: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
      };
    };

    const shapeCount = Math.max(10, Math.round(14 + intensity * 16));
    shapesRef.current = Array.from({ length: shapeCount }, createShape);

    const drawShape = (ctx2d: CanvasRenderingContext2D, shape: Shape) => {
      ctx2d.save();
      ctx2d.translate(shape.x, shape.y);
      ctx2d.rotate(shape.rotation);
      ctx2d.globalAlpha = shape.opacity;
      ctx2d.strokeStyle = "rgba(255,255,255,0.35)";
      ctx2d.lineWidth = 1.5;
      ctx2d.beginPath();

      switch (shape.type) {
        case "circle":
          ctx2d.arc(0, 0, shape.size * 0.5, 0, Math.PI * 2);
          break;
        case "triangle": {
          const side = shape.size;
          for (let i = 0; i < 3; i += 1) {
            const angle = (i / 3) * Math.PI * 2;
            const x = Math.cos(angle) * (side * 0.5);
            const y = Math.sin(angle) * (side * 0.5);
            if (i === 0) ctx2d.moveTo(x, y);
            else ctx2d.lineTo(x, y);
          }
          ctx2d.closePath();
          break;
        }
        case "hexagon": {
          const radius = shape.size * 0.45;
          for (let i = 0; i < 6; i += 1) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx2d.moveTo(x, y);
            else ctx2d.lineTo(x, y);
          }
          ctx2d.closePath();
          break;
        }
        default:
          ctx2d.arc(0, 0, shape.size * 0.5, 0, Math.PI * 2);
      }

      ctx2d.stroke();
      ctx2d.restore();
    };

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

      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      shapesRef.current.forEach((shape, index) => {
        shape.rotation += shape.rotationSpeed * delta;
        shape.x += shape.driftX * delta * 0.4;
        shape.y += shape.driftY * delta * 0.4;

        if (
          shape.x < -shape.size ||
          shape.y < -shape.size ||
          shape.x > window.innerWidth + shape.size ||
          shape.y > window.innerHeight + shape.size
        ) {
          shapesRef.current[index] = createShape();
        }

        drawShape(context, shape);
      });

      animationRef.current = window.requestAnimationFrame(render);
    };

    animationRef.current = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
      shapesRef.current = [];
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
