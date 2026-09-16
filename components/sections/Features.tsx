"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { SceneCanvas } from "@/components/three/LazyCanvas";
import { SplitLines } from "@/components/ui/SplitLines";
import { features, mechanics, underlying } from "@/lib/content";
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
              text="What you would actually own."
              className="headline max-w-[16ch] text-[clamp(1.9rem,4.4vw,3.5rem)] text-cold-100"
            />
          </div>
          <p className="label max-w-[26ch] text-cold-350 md:text-right">
            {isMobile ? "Tap a card" : "Hover a card"} · depth reorders as you
            scroll
          </p>
        </div>
      </div>

      {/* Capped height: on a tall window a vh-only band leaves the deck
          marooned in the middle of a mostly empty canvas, and pushes it past
          the fold. */}
      <div className="relative h-[min(58vh,460px)] min-h-[340px] w-full md:h-[min(52vh,560px)]">
        <SceneCanvas
          className="absolute inset-0 h-full w-full"
          camera={{ position: [0, 0, 6.6], fov: 42 }}
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

        {/* How the thing actually works */}
        <div className="mt-20 grid gap-12 border-t border-cold-500/20 pt-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="label mb-8">The mechanism</p>
            <ol className="grid gap-px bg-cold-500/20">
              {mechanics.map((step) => (
                <li
                  key={step.step}
                  className="flex gap-6 bg-ink-deep py-6 pr-4 md:gap-8"
                >
                  <span className="label shrink-0 text-[10px] text-amber">
                    {step.step}
                  </span>
                  <div>
                    <h3 className="headline mb-2 text-[clamp(1.1rem,1.9vw,1.45rem)] text-cold-100">
                      {step.title}
                    </h3>
                    <p className="max-w-[46ch] text-[14px] leading-relaxed text-cold-300">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="border border-cold-500/25 p-7 md:p-9">
            <div className="mb-7 flex items-baseline justify-between gap-4">
              <p className="label">{underlying.label}</p>
              <p className="font-mono text-[12px] tracking-[0.12em] text-amber">
                {underlying.ticker}
              </p>
            </div>

            <h3 className="headline mb-5 text-[clamp(1.2rem,2.1vw,1.6rem)] text-cold-100">
              {underlying.title}
            </h3>
            <p className="mb-8 max-w-[48ch] text-[14px] leading-relaxed text-cold-300">
              {underlying.body}
            </p>

            <dl className="grid gap-px bg-cold-500/20">
              {underlying.facts.map(([term, value]) => (
                <div
                  key={term}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 bg-ink-deep py-3"
                >
                  <dt className="label text-[10px]">{term}</dt>
                  <dd className="font-mono text-[12px] text-cold-200">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
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
