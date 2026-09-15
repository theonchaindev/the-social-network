"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useMediaQuery";

/**
 * Fincher's edit: black for two frames, one frame of grain, then you are
 * somewhere else. Intercepts in-page anchors so jumps cut rather than glide.
 */
export function HardCut() {
  const [cut, setCut] = useState(false);
  const [flash, setFlash] = useState(false);
  const reduced = useReducedMotion();
  const busy = useRef(false);

  const scrollTo = useCallback((target: Element) => {
    const top = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: "auto" });
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.button !== 0) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      if (busy.current) return;

      if (reduced) {
        scrollTo(target);
        return;
      }

      busy.current = true;
      setCut(true);

      window.setTimeout(() => {
        setFlash(true);
        scrollTo(target);
      }, 150);

      window.setTimeout(() => setFlash(false), 190);

      window.setTimeout(() => {
        setCut(false);
        busy.current = false;
      }, 330);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [reduced, scrollTo]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[75] bg-ink-deep"
      style={{
        opacity: cut ? 1 : 0,
        transition: cut ? "opacity 120ms linear" : "opacity 170ms linear",
        visibility: cut ? "visible" : "hidden",
      }}
    >
      <div
        className="absolute inset-0 bg-white"
        style={{ opacity: flash ? 0.06 : 0 }}
      />
    </div>
  );
}
