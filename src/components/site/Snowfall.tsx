"use client";

import { useEffect, useRef } from "react";

type Flake = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  phase: number;
  opacity: number;
};

/**
 * Winter snowfall drawn on a single fixed canvas. One requestAnimationFrame
 * loop, no DOM nodes per flake, no layout work, and it stops completely while
 * the tab is hidden or when the visitor prefers reduced motion.
 */
export function Snowfall({ density = 0.00006 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    const context = element.getContext("2d", { alpha: true });
    if (!context) return;

    const surface: HTMLCanvasElement = element;
    const ctx: CanvasRenderingContext2D = context;

    let width = 0;
    let height = 0;
    let flakes: Flake[] = [];
    let frame = 0;
    let lastTime = 0;

    const makeFlake = (startAnywhere: boolean): Flake => ({
      x: Math.random() * width,
      y: startAnywhere ? Math.random() * height : -8 - Math.random() * 60,
      radius: 1.1 + Math.random() * 2.1,
      speed: 14 + Math.random() * 26,
      drift: 6 + Math.random() * 14,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.35 + Math.random() * 0.5,
    });

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.floor(width * ratio);
      surface.height = Math.floor(height * ratio);
      surface.style.width = `${width}px`;
      surface.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const target = Math.max(18, Math.min(90, Math.round(width * height * density)));
      if (flakes.length > target) flakes = flakes.slice(0, target);
      while (flakes.length < target) flakes.push(makeFlake(true));
    }

    function draw(time: number) {
      const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0.016;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      for (const flake of flakes) {
        flake.y += flake.speed * delta;
        flake.phase += delta * 0.9;
        flake.x += Math.sin(flake.phase) * flake.drift * delta;

        if (flake.y - flake.radius > height + 10) {
          Object.assign(flake, makeFlake(false));
        } else if (flake.x < -20) {
          flake.x = width + 20;
        } else if (flake.x > width + 20) {
          flake.x = -20;
        }

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.globalAlpha = flake.opacity;
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        // A faint warm edge keeps the flakes legible over the cream sections.
        ctx.globalAlpha = flake.opacity * 0.5;
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = "#9c9489";
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
    }

    function start() {
      window.cancelAnimationFrame(frame);
      lastTime = 0;
      frame = window.requestAnimationFrame(draw);
    }

    function stop() {
      window.cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      ctx.clearRect(0, 0, width, height);
    }

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    resize();
    start();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[45] h-full w-full"
    />
  );
}
