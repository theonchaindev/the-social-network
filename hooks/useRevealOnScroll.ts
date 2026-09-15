"use client";

import { RefObject, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "./useMediaQuery";

/**
 * Generic entrance for non-text blocks: scale down from 1.05, de-blur, rise.
 * Targets `[data-reveal]` descendants of the scope.
 */
export function useRevealOnScroll(
  scope: RefObject<HTMLElement | null>,
  { stagger = 0.09, start = "top 85%", y = 26 } = {},
) {
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    const targets = el.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!targets.length) return;

    if (reduced) {
      gsap.set(targets, { opacity: 1, y: 0, scale: 1, filter: "none" });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y, scale: 1.05, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.2,
          stagger,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start, once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [scope, stagger, start, y, reduced]);
}
