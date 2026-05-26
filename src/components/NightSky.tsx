"use client";

import { useEffect, useRef } from "react";

/**
 * NightSky — a fixed, full-viewport star field painted behind all content.
 *
 * Only active in dark mode (the `.dark` class on <html>, toggled by ThemeToggle).
 * In light mode the canvas is cleared, so the paper background shows through.
 *
 * A soft twinkle field over a deep blue-black base, with a subtle blue nebula
 * tint that gives the whole thing a navy "night sky" cast, plus a slow parallax
 * drift. Honors prefers-reduced-motion by painting a single static frame.
 */

type Star = {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  r: number; // radius in px
  base: number; // base opacity factor 0..1
  amp: number; // twinkle amplitude
  phase: number; // twinkle phase offset
  freq: number; // twinkle frequency
  depth: number; // parallax depth 0..1
};

// Star count scales with viewport area so density stays consistent on any
// screen (a fixed count looks dense in a small preview, empty full-screen).
const STAR_DENSITY = 42; // stars per 100,000 px²
const MIN_STARS = 80;
const MAX_STARS = 650; // cap for very large displays
const BRIGHTNESS = 0.05; // overall star opacity scale
const SPEED = 3; // twinkle speed (1–10 in the preview)
const DRIFT = true; // slow parallax drift
const NEBULA = true; // faint navy color glows

const starCountFor = (w: number, h: number) =>
  Math.max(
    MIN_STARS,
    Math.min(MAX_STARS, Math.round(((w * h) / 100000) * STAR_DENSITY)),
  );

export function NightSky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let t = 0;
    let raf = 0;
    let stars: Star[] = [];
    let isDark = document.documentElement.classList.contains("dark");
    let clearedOnce = false; // ensures we clear once when leaving dark mode
    let staticDrawn = false; // for reduced-motion: only paint once

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      staticDrawn = false;
    };

    const build = () => {
      stars = [];
      const count = starCountFor(width, height);
      for (let i = 0; i < count; i++) {
        const layer = Math.random();
        stars.push({
          x: Math.random(),
          y: Math.random(),
          r: 0.7 + layer * 1.7,
          base: 0.45 + Math.random() * 0.5,
          amp: 0.25 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
          freq: 0.3 + Math.random() * 0.9,
          depth: 0.3 + layer * 0.7,
        });
      }
      staticDrawn = false;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      // Deep blue-black base — a navy night sky rather than pure space-black.
      ctx.fillStyle = "#070b18";
      ctx.fillRect(0, 0, width, height);

      if (NEBULA) {
        const g1 = ctx.createRadialGradient(
          width * 0.28,
          height * 0.32,
          0,
          width * 0.28,
          height * 0.32,
          Math.max(width, height) * 0.55,
        );
        g1.addColorStop(0, "rgba(56,98,205,0.16)");
        g1.addColorStop(1, "rgba(56,98,205,0)");
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, width, height);

        const g2 = ctx.createRadialGradient(
          width * 0.78,
          height * 0.7,
          0,
          width * 0.78,
          height * 0.7,
          Math.max(width, height) * 0.5,
        );
        g2.addColorStop(0, "rgba(40,80,170,0.12)");
        g2.addColorStop(1, "rgba(40,80,170,0)");
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, width, height);
      }

      const dx = DRIFT && !reduced ? Math.sin(t * 0.05) * 6 : 0;
      const dy = DRIFT && !reduced ? t * 0.15 : 0;

      for (const s of stars) {
        const px = s.x * width + dx * s.depth;
        let py = (s.y * height + dy * s.depth) % height;
        if (py < 0) py += height;

        let pulse = reduced
          ? s.base
          : s.base + Math.sin(t * s.freq * (SPEED / 4) + s.phase) * s.amp;
        if (pulse < 0) pulse = 0;
        if (pulse > 1) pulse = 1;

        const alpha = pulse * BRIGHTNESS;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,234,245,${alpha.toFixed(3)})`;
        ctx.fill();
      }
    };

    const frame = () => {
      // Sync to live theme changes (ThemeToggle dispatches "themechange").
      const nowDark = document.documentElement.classList.contains("dark");
      if (nowDark !== isDark) {
        isDark = nowDark;
        clearedOnce = false;
        staticDrawn = false;
      }

      if (isDark) {
        if (reduced) {
          if (!staticDrawn) {
            draw();
            staticDrawn = true;
          }
        } else {
          t += 0.016;
          draw();
        }
      } else if (!clearedOnce) {
        ctx.clearRect(0, 0, width, height);
        clearedOnce = true;
      }

      raf = requestAnimationFrame(frame);
    };

    const onResize = () => {
      resize();
      build();
    };

    resize();
    build();
    raf = requestAnimationFrame(frame);

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
