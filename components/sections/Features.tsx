"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { SceneCanvas } from "@/components/three/LazyCanvas";
import { SplitLines } from "@/components/ui/SplitLines";
import { features } from "@/lib/content";
import { ScrollTrigger } from "@/lib/gsap";
import { useIsMobile, useReducedMotion } from "@/hooks/useMediaQuery";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

const GlassCardsScene = dynamic(() => import("@/components/three/GlassCards"), {
  ssr: false,
});

export function Features() {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();

  useRevealOnScroll(copy, { stagger: 0.07 });

  const onHover = useCallback((index: number | null) => setActive(index), []);

  useEffect(() => {
    const el = section.current;
    if (!el || reduced) {
      progress.current = 0.5;
      return;
    }
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });
    return () => trigger.kill();
  }, [reduced]);

  const shown = active ?? 0;

  return (
    <section
      ref={section}
      id="product"
      className="relative overflow-hidden bg-ink-deep py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        <div className="mb-6 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label mb-6">The product</p>
            <SplitLines
              as="h2"
              text="Six primitives. No opening bell."
              className="headline max-w-[16ch] text-[clamp(1.9rem,4.4vw,3.5rem)] text-cold-100"
            />
          </div>
          <p className="label max-w-[26ch] text-cold-350 md:text-right">
            {isMobile ? "Tap a card" : "Hover a card"} · depth reorders as you
            scroll
          </p>
        </div>
      </div>

      <div className="relative h-[56vh] min-h-[380px] w-full md:h-[66vh]">
        <SceneCanvas
          className="absolute inset-0 h-full w-full"
          camera={{ position: [0, 0, 6.2], fov: 42 }}
        >
          <GlassCardsScene progress={progress} onHover={onHover} />
        </SceneCanvas>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        <div
          ref={copy}
          className="mt-12 grid gap-10 border-t border-cold-500/20 pt-10 md:grid-cols-[1fr_1.1fr]"
        >
          <div data-reveal>
            <p className="label mb-4 text-amber">
              {String(shown + 1).padStart(2, "0")} · {features[shown].meta}
            </p>
            <h3 className="headline text-[clamp(1.5rem,3vw,2.3rem)] text-cold-100">
              {features[shown].title}
            </h3>
          </div>
          <p
            data-reveal
            className="max-w-[52ch] text-[15px] leading-relaxed text-cold-300"
          >
            {features[shown].body}
          </p>
        </div>

        {/* Hover is not available on touch, so the full list stays readable */}
        <ul className="mt-12 grid gap-px bg-cold-500/20 md:hidden">
          {features.map((feature, i) => (
            <li key={feature.id} className="bg-ink-deep p-6">
              <p className="label mb-3 text-[10px] text-amber">
                {String(i + 1).padStart(2, "0")} · {feature.meta}
              </p>
              <h3 className="headline mb-3 text-xl text-cold-100">
                {feature.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-cold-300">
                {feature.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
