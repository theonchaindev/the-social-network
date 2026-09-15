"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { SceneCanvas } from "@/components/three/LazyCanvas";
import { SplitLines } from "@/components/ui/SplitLines";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

const RainGlass = dynamic(() => import("@/components/three/RainGlass"), {
  ssr: false,
});

export function RainTransition() {
  const scope = useRef<HTMLDivElement>(null);
  useRevealOnScroll(scope, { stagger: 0.1, start: "top 78%" });

  return (
    <section className="relative h-[85svh] min-h-[520px] w-full overflow-hidden">
      <SceneCanvas
        className="absolute inset-0 h-full w-full"
        camera={{ position: [0, 0, 1], fov: 50 }}
        rootMargin="400px"
      >
        <RainGlass />
      </SceneCanvas>

      <div className="pointer-events-none absolute inset-0 bg-ink-deep/35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink-deep to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-deep to-transparent" />

      <div
        ref={scope}
        className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-center px-6 md:px-12"
      >
        <p data-reveal className="label mb-8">
          Interstitial · 04:06 EST
        </p>
        <SplitLines
          as="p"
          text="Nobody watches a market at four in the morning. The market does not care."
          className="headline max-w-[17ch] text-[clamp(1.75rem,4.6vw,3.6rem)] text-cold-100"
          start="top 80%"
        />
        <p
          data-reveal
          className="mt-10 max-w-[44ch] border-l border-cold-500/40 pl-6 text-[14px] leading-relaxed text-cold-300"
        >
          Settlement runs while the building sleeps. The attestation clock does
          not observe holidays, weekends, or the end of a quarter.
        </p>
      </div>
    </section>
  );
}
