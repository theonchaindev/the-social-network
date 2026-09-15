"use client";

import { useEffect, useRef, useState } from "react";
import { useHasFinePointer, useReducedMotion } from "@/hooks/useMediaQuery";

/**
 * Dot + trailing ring. Over anything interactive the ring opens into a
 * "connect" target and the dot drops away.
 */
export function CustomCursor() {
  const fine = useHasFinePointer();
  const reduced = useReducedMotion();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [connect, setConnect] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!fine || reduced) return;
    document.documentElement.classList.add("has-custom-cursor");
    return () => document.documentElement.classList.remove("has-custom-cursor");
  }, [fine, reduced]);

  useEffect(() => {
    if (!fine || reduced) return;

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...pos };
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!visible) setVisible(true);
      const target = e.target as HTMLElement | null;
      setConnect(
        !!target?.closest?.("a, button, [data-cursor='connect'], input, textarea"),
      );
    };

    const loop = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.16;
      ringPos.y += (pos.y - ringPos.y) * 0.16;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [fine, reduced, visible]);

  if (!fine || reduced) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70]"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        ref={dot}
        className="absolute left-0 top-0 h-1 w-1 rounded-full bg-amber transition-opacity duration-200"
        style={{ opacity: connect ? 0 : 1 }}
      />
      <div
        ref={ring}
        className="absolute left-0 top-0 rounded-full border transition-all duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: connect ? 44 : 22,
          height: connect ? 44 : 22,
          borderColor: connect ? "#e8a33d" : "rgba(151,164,182,0.45)",
          borderWidth: connect ? 1 : 1,
        }}
      />
    </div>
  );
}
