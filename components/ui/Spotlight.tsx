"use client";

import { useEffect, useRef } from "react";
import { useHasFinePointer, useReducedMotion } from "@/hooks/useMediaQuery";

/** A soft practical that follows the cursor across the crushed blacks. */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useHasFinePointer();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!fine || reduced) return;
    const el = ref.current;
    if (!el) return;

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const eased = { ...pos };
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
    };

    const loop = () => {
      eased.x += (pos.x - eased.x) * 0.06;
      eased.y += (pos.y - eased.y) * 0.06;
      el.style.background = `radial-gradient(520px circle at ${eased.x}px ${eased.y}px, rgba(232,163,61,0.055), rgba(59,89,152,0.035) 42%, transparent 72%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [fine, reduced]);

  if (!fine || reduced) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[45] mix-blend-screen"
    />
  );
}
