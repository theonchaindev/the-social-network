"use client";

import { useRef } from "react";
import { SplitLines } from "@/components/ui/SplitLines";
import { timeline } from "@/lib/content";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";
import { useReducedMotion } from "@/hooks/useMediaQuery";

export function Timeline() {
  const section = useRef<HTMLElement>(null);
  const pinned = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useHorizontalScroll(section, pinned, track);

  return (
    <section ref={section} id="timeline" className="relative bg-ink">
      <div
        ref={pinned}
        className="relative flex h-[100svh] w-full flex-col overflow-hidden pb-16 pt-28 md:pt-36"
      >
        <div className="mx-auto w-full max-w-[1400px] shrink-0 px-6 md:px-12">
          <p className="label mb-6">Twenty-two years</p>
          <SplitLines
            as="h2"
            text="2004 to 2026, in eight frames."
            className="headline max-w-[18ch] text-[clamp(1.75rem,4vw,3rem)] text-cold-100"
          />
        </div>

        <div className="flex flex-1 items-center">
          <div
            ref={track}
            className={`flex w-max ${
              reduced ? "max-w-full overflow-x-auto pb-6" : ""
            }`}
          >
          {timeline.map((entry, i) => (
            <article
              key={entry.year}
              className="group relative w-[78vw] shrink-0 border-l border-cold-500/20 px-6 py-10 transition-colors duration-700 hover:bg-ink-raise/40 sm:w-[46vw] md:w-[30vw] md:px-10 lg:w-[24vw]"
            >
              <p className="label mb-8 text-[10px]">
                {String(i + 1).padStart(2, "0")} / {timeline.length}
              </p>

              <p className="font-mono text-[clamp(2.4rem,4.5vw,3.6rem)] leading-none text-amber/90">
                {entry.year}
              </p>

              <h3 className="headline mt-8 text-[clamp(1.3rem,2.2vw,1.85rem)] text-cold-100">
                {entry.title}
              </h3>

              <p className="mt-5 max-w-[34ch] text-[14px] leading-relaxed text-cold-300">
                {entry.body}
              </p>

              <span className="absolute inset-y-0 left-0 w-px origin-top scale-y-0 bg-amber transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100" />
            </article>
          ))}
            <div className="w-[12vw] shrink-0" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
