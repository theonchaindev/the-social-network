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
          Interstitial · Kirkland House, 02:14
        </p>
        <SplitLines
          as="p"
          text="Friendship was the interface. The list was the asset."
          className="headline max-w-[16ch] text-[clamp(1.85rem,4.8vw,3.8rem)] text-cold-100"
          start="top 80%"
        />
        <p
          data-reveal
          className="mt-10 max-w-[46ch] border-l border-cold-500/40 pl-6 text-[14px] leading-relaxed text-cold-300"
        >
          Two thousand faces on a closed campus, ordered by nothing but who
          already knew whom. Everything built since has been an argument about
          what that ordering is worth.
        </p>
      </div>
    </section>
  );
}
