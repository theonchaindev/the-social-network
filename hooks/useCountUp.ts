"use client";

import { RefObject, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "./useMediaQuery";

type Options = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
};

const format = (n: number, decimals: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/** Ticks a number up when its element scrolls into view. */
export function useCountUp(
  el: RefObject<HTMLElement | null>,
  { value, decimals = 0, prefix = "", suffix = "", duration = 2.2 }: Options,
) {
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = el.current;
    if (!node) return;

    const write = (n: number) => {
      node.textContent = `${prefix}${format(n, decimals)}${suffix}`;
    };

    if (reduced) {
      write(value);
      return;
    }

    write(0);
    const counter = { n: 0 };
    const ctx = gsap.context(() => {
      gsap.to(counter, {
        n: value,
        duration,
        ease: "power4.out",
        onUpdate: () => write(counter.n),
        scrollTrigger: { trigger: node, start: "top 88%", once: true },
      });
    }, node);

    return () => ctx.revert();
  }, [el, value, decimals, prefix, suffix, duration, reduced]);
}
