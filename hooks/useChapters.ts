"use client";

import { MutableRefObject, RefObject, useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "./useMediaQuery";

type Args = {
  section: RefObject<HTMLElement | null>;
  pinned: RefObject<HTMLElement | null>;
  chapters: RefObject<(HTMLElement | null)[]>;
  progress: MutableRefObject<number>;
  count: number;
  onActive?: (index: number) => void;
};

/**
 * Pins the chapter stage and scrubs it: the 3D graph grows continuously while
 * the copy hard-cuts from one chapter to the next.
 */
export function useChapters({ section, pinned, chapters, progress, count, onActive }: Args) {
  const reduced = useReducedMotion();

  useEffect(() => {
    const sectionEl = section.current;
    const pinnedEl = pinned.current;
    const blocks = chapters.current?.filter(Boolean) as HTMLElement[] | undefined;
    if (!sectionEl || !pinnedEl || !blocks?.length) return;

    if (reduced) {
      // No pin, no scrub: show every chapter stacked and the graph fully grown.
      gsap.set(blocks, { autoAlpha: 1, position: "relative", yPercent: 0 });
      progress.current = 1;
      return;
    }

    let lastIndex = -1;

    const ctx = gsap.context(() => {
      gsap.set(blocks.slice(1), { autoAlpha: 0, yPercent: 6 });
      gsap.set(blocks[0], { autoAlpha: 1, yPercent: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionEl,
          pin: pinnedEl,
          start: "top top",
          end: `+=${count * 110}%`,
          scrub: 0.6,
          anticipatePin: 1,
          onUpdate: (self) => {
            // Ease the graph's growth so it is mostly done before the last beat.
            progress.current = Math.min(1, self.progress * 1.12);
            const index = Math.min(
              count - 1,
              Math.floor(self.progress * count + 0.28),
            );
            if (index !== lastIndex) {
              lastIndex = index;
              onActive?.(index);
            }
          },
        },
      });

      for (let i = 0; i < blocks.length - 1; i++) {
        const at = i + 0.72;
        tl.to(blocks[i], { autoAlpha: 0, yPercent: -6, duration: 0.3, ease: "power4.inOut" }, at);
        tl.fromTo(
          blocks[i + 1],
          { autoAlpha: 0, yPercent: 6 },
          { autoAlpha: 1, yPercent: 0, duration: 0.34, ease: "expo.out" },
          at + 0.16,
        );
      }

      tl.set({}, {}, blocks.length);
    }, sectionEl);

    return () => ctx.revert();
  }, [section, pinned, chapters, progress, count, reduced, onActive]);

  useEffect(() => {
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => window.clearTimeout(id);
  }, []);
}
