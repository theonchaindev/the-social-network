"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string, defaultValue = false) {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** True when the user has asked the OS to reduce motion. */
export const useReducedMotion = () =>
  useMediaQuery("(prefers-reduced-motion: reduce)");

/** Coarse pointer / small viewport — drives the lighter 3D tier. */
export const useIsMobile = () => useMediaQuery("(max-width: 767px)");

/** No hover means no custom cursor, no magnetic buttons. */
export const useHasFinePointer = () =>
  useMediaQuery("(hover: hover) and (pointer: fine)");
