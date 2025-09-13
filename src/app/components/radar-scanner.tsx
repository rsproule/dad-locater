"use client";

import { useEffect, useRef } from "react";

export default function RadarScanner({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const c = canvasRef.current as HTMLCanvasElement;
    let width = c.clientWidth;
    let height = c.clientHeight;
    c.width = width * devicePixelRatio;
    c.height = height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    function draw(timestamp: number) {
      if (!active) return;
      if (!startRef.current) startRef.current = timestamp;
      const progress = ((timestamp - startRef.current) / 2000) % 1; // 2s per full sweep

      width = c.clientWidth;
      height = c.clientHeight;
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) / 2 - 8;

      // Background grid
      ctx.strokeStyle = "rgba(100, 200, 100, 0.25)";
      ctx.lineWidth = 1;
      for (let r = radius; r > 0; r -= radius / 4) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + Math.cos(angle) * radius,
          cy + Math.sin(angle) * radius,
        );
        ctx.stroke();
      }

      // Sweep
      const angle = progress * Math.PI * 2;
      const sweepWidth = Math.PI / 12;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, "rgba(0, 255, 128, 0.0)");
      gradient.addColorStop(1, "rgba(0, 255, 128, 0.25)");

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle - sweepWidth, angle + sweepWidth);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // No blip dot

      requestRef.current = requestAnimationFrame(draw);
    }

    if (active) {
      requestRef.current = requestAnimationFrame(draw);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
      startRef.current = 0;
    };
  }, [active]);

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden bg-card/20">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
