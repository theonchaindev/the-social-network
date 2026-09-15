"use client";

import { RefObject, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "./useMediaQuery";

/**
 * Pins a section and drives its track sideways for the height of the scroll.
 * Falls back to a native horizontal scroller when motion is reduced.
 */
export function useHorizontalScroll(
  section: RefObject<HTMLElement | null>,
  pinned: RefObject<HTMLElement | null>,
  track: RefObject<HTMLElement | null>,
) {
  const reduced = useReducedMotion();

  useEffect(() => {
    const sectionEl = section.current;
    const pinnedEl = pinned.current;
    const trackEl = track.current;
    if (!sectionEl || !pinnedEl || !trackEl || reduced) return;

    const ctx = gsap.context(() => {
      const distance = () => trackEl.scrollWidth - window.innerWidth;

      gsap.to(trackEl, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: sectionEl,
          pin: pinnedEl,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, sectionEl);

    return () => ctx.revert();
  }, [section, pinned, track, reduced]);
}
