"use client";

import { useRef } from "react";
import { Counter } from "@/components/ui/Counter";
import { SplitLines } from "@/components/ui/SplitLines";
import { stats } from "@/lib/content";
import { useLineReveal } from "@/hooks/useLineReveal";

export function Stats() {
  const grid = useRef<HTMLDivElement>(null);
  useLineReveal(grid, { stagger: 0.09, start: "top 85%" });

  return (
    <section
      id="numbers"
      className="relative border-y border-cold-500/15 bg-ink py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SplitLines
            as="h2"
            text="Scale is the only moat."
            className="headline max-w-[14ch] text-[clamp(1.9rem,4.4vw,3.5rem)] text-cold-100"
          />
          <p className="label max-w-[28ch] text-cold-350">
            Indexed 00:00 UTC · illustrative figures
          </p>
        </div>

        <div ref={grid} className="grid grid-cols-1 gap-px bg-cold-500/20 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden bg-ink-deep/80 p-8 backdrop-blur-md transition-colors duration-700 hover:bg-ink-raise/70 md:p-10"
            >
              {/* Practical catching the top edge of the glass */}
              <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-amber/40 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

              <Counter
                value={stat.value}
                decimals={"decimals" in stat ? stat.decimals : 0}
                prefix={"prefix" in stat ? stat.prefix : ""}
                suffix={stat.suffix}
                label={stat.label}
                className="headline block text-[clamp(1.8rem,3.4vw,2.9rem)] text-cold-100"
              />

              <p className="mt-6 text-[13px] leading-relaxed text-cold-200">
                {stat.label}
              </p>
              <p className="label mt-2 text-[10px]">{stat.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
