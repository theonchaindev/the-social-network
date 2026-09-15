"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "./useMediaQuery";

/**
 * Drives Lenis from GSAP's ticker so smooth scrolling and ScrollTrigger share
 * one clock. Without this the pinned chapters drift a frame behind the scroll.
 */
export function useSmoothScroll(enabled = true) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!enabled || reduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [enabled, reduced]);
}
