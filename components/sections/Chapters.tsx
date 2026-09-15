"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { SceneCanvas } from "@/components/three/LazyCanvas";
import { useChapters } from "@/hooks/useChapters";
import { chapters } from "@/lib/content";

const GraphScene = dynamic(() => import("@/components/three/GraphScene"), {
  ssr: false,
});

export function Chapters() {
  const section = useRef<HTMLElement>(null);
  const pinned = useRef<HTMLDivElement>(null);
  const blocks = useRef<(HTMLDivElement | null)[]>([]);
  const progress = useRef(0);
  const [active, setActive] = useState(0);
  const onActive = useCallback((index: number) => setActive(index), []);

  useChapters({
    section,
    pinned,
    chapters: blocks,
    progress,
    count: chapters.length,
    onActive,
  });

  return (
    <section ref={section} id="idea" className="relative bg-ink-deep">
      <div ref={pinned} className="relative h-[100svh] w-full overflow-hidden">
        <SceneCanvas
          className="absolute inset-0 h-full w-full"
          camera={{ position: [0, 0, 9], fov: 45 }}
        >
          <GraphScene progress={progress} />
        </SceneCanvas>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-deep via-ink-deep/40 to-transparent md:via-ink-deep/20" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-deep to-transparent" />

        <p className="label absolute left-6 top-10 z-10 md:left-12">
          The idea
        </p>

        {/* Chapter rail */}
        <ol className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-5 md:right-12 md:flex">
          {chapters.map((chapter, i) => (
            <li key={chapter.id} className="flex items-center justify-end gap-4">
              <span
                className="label text-[10px] transition-colors duration-700"
                style={{ color: i === active ? "#e8a33d" : "#4c5a70" }}
              >
                {chapter.index}
              </span>
              <span
                className="block h-px transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  width: i === active ? 44 : 18,
                  background: i === active ? "#e8a33d" : "#354154",
                }}
              />
            </li>
          ))}
        </ol>

        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-center px-6 md:px-12">
          <div className="relative w-full max-w-[38rem]">
            {chapters.map((chapter, i) => (
              <div
                key={chapter.id}
                ref={(el) => {
                  blocks.current[i] = el;
                }}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2"
                style={{ visibility: "hidden" }}
              >
                <p className="label mb-6 flex items-center gap-4">
                  <span className="text-amber">{chapter.index}</span>
                  <span className="h-px w-10 bg-cold-500" />
                  <span>{chapter.kicker}</span>
                  <span className="ml-auto text-cold-300">{chapter.year}</span>
                </p>

                <h2 className="headline mb-7 text-[clamp(2rem,5.2vw,4.25rem)] text-cold-100">
                  {chapter.title}
                </h2>

                <p className="max-w-[44ch] text-[15px] leading-relaxed text-cold-300">
                  {chapter.body}
                </p>

                <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-cold-500/25 pt-5">
                  {chapter.meta.map((m) => (
                    <li key={m} className="label text-[10px] text-cold-350">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Reserves the block's height so the pinned stage never jumps */}
            <div aria-hidden="true" className="invisible">
              <p className="label mb-6">placeholder</p>
              <h2 className="headline mb-7 text-[clamp(2rem,5.2vw,4.25rem)]">
                {chapters[1].title}
              </h2>
              <p className="max-w-[44ch] text-[15px] leading-relaxed">
                {chapters[1].body}
              </p>
              <ul className="mt-10 border-t pt-5">
                <li className="label text-[10px]">placeholder</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
