"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useMediaQuery";

/**
 * A single thin line, a monospace percentage, then a hard cut to black and
 * straight into the hero. No spinner, no logo reveal.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [cutting, setCutting] = useState(false);
  const [gone, setGone] = useState(false);
  const reduced = useReducedMotion();
  const done = useRef(false);

  useEffect(() => {
    let raf = 0;
    let value = 0;
    const started = performance.now();

    const finish = () => {
      done.current = true;
      setProgress(100);
      setCutting(true);
      window.setTimeout(() => {
        setGone(true);
        onDone();
      }, 260);
    };

    const tick = (now: number) => {
      // Reduced motion skips the whole sequence on the first frame. Handled
      // here rather than in the effect body to avoid a cascading render.
      if (reduced) {
        setGone(true);
        onDone();
        return;
      }

      const elapsed = now - started;
      // Ease toward 100 over ~1.6s, but never hang at 99.
      const target = Math.min(100, (elapsed / 1600) * 100);
      value += (target - value) * 0.14;
      setProgress(value);

      if (value > 99.4 && !done.current) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone, reduced]);

  if (gone) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-ink-deep transition-opacity duration-200"
      style={{ opacity: cutting ? 0 : 1 }}
    >
      {/* One frame of grain flashes as it cuts */}
      <div
        className="pointer-events-none absolute inset-0 bg-white"
        style={{ opacity: cutting ? 0.045 : 0 }}
      />
      <div className="w-[min(58vw,420px)]">
        <div className="mb-4 flex items-baseline justify-between font-mono text-[11px] tracking-[0.2em] text-cold-350">
          <span>LOADING</span>
          <span className="tabular-nums text-cold-200">
            {String(Math.floor(progress)).padStart(3, "0")}%
          </span>
        </div>
        <div className="h-px w-full bg-cold-500/40">
          <div
            className="h-px bg-amber"
            style={{ width: `${progress}%`, transition: "width 90ms linear" }}
          />
        </div>
      </div>
    </div>
  );
}
