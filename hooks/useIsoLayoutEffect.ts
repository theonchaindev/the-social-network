import { useEffect, useLayoutEffect } from "react";

/** useLayoutEffect that degrades to useEffect during SSR to avoid hydration warnings. */
export const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
