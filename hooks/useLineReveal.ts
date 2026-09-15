"use client";

import { RefObject, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "./useMediaQuery";

type Options = {
  /** Wait for the preloader to cut before playing, instead of scroll position. */
  immediate?: boolean;
  delay?: number;
  stagger?: number;
  start?: string;
  ready?: boolean;
};

/**
 * Rises `.split-line > span` children from below their mask on scroll.
 * 0.8s expo.out with a tight stagger — the house entrance for all copy.
 */
export function useLineReveal(
  scope: RefObject<HTMLElement | null>,
  { immediate = false, delay = 0, stagger = 0.075, start = "top 82%", ready = true }: Options = {},
) {
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = scope.current;
    if (!el || !ready) return;

    const targets = el.querySelectorAll<HTMLElement>(".split-line > span");
    if (!targets.length) return;

    if (reduced) {
      gsap.set(targets, { yPercent: 0, opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { yPercent: 108, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.8,
          delay,
          stagger,
          ease: "expo.out",
          ...(immediate
            ? {}
            : { scrollTrigger: { trigger: el, start, once: true } }),
        },
      );
    }, el);

    return () => ctx.revert();
  }, [scope, immediate, delay, stagger, start, reduced, ready]);
}
