"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { SceneCanvas } from "@/components/three/LazyCanvas";
import { SplitLines } from "@/components/ui/SplitLines";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { social } from "@/lib/content";

const CRTScene = dynamic(() => import("@/components/three/CRTScene"), {
  ssr: false,
});

export function Community() {
  const scope = useRef<HTMLDivElement>(null);
  useRevealOnScroll(scope, { stagger: 0.08, start: "top 80%" });

  return (
    <section
      id="community"
      className="relative overflow-hidden border-t border-cold-500/15 bg-ink-deep"
    >
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-6 py-24 md:grid-cols-2 md:px-12 md:py-32">
        <div ref={scope}>
          <p data-reveal className="label mb-8">
            Access · Kirkland House, 02:14
          </p>

          <SplitLines
            as="h2"
            text="The list is short on purpose."
            className="headline max-w-[14ch] text-[clamp(2rem,4.6vw,3.6rem)] text-cold-100"
            start="top 80%"
          />

          <p
            data-reveal
            className="mt-8 max-w-[44ch] text-[15px] leading-relaxed text-cold-300"
          >
            Everything gets posted before it gets explained. Build notes,
            attestation runs, the arguments that did not survive contact with a
            spreadsheet — all of it goes out in one place, in public.
          </p>

          <div data-reveal className="mt-10">
            <MagneticButton href={social.url} external>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 fill-current"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {social.label}
            </MagneticButton>
            {/* The handle in plain text: someone reading on a phone can type it
                in without trusting a button to open the right account. */}
            <p className="label mt-4 text-[10px]">{social.handle}</p>
          </div>

          <p className="label mt-6 text-[10px]">
            No mailing list. No allocation. No exceptions.
          </p>
        </div>

        <div className="relative h-[46vh] min-h-[320px] w-full md:h-[64vh]">
          <SceneCanvas
            className="absolute inset-0 h-full w-full"
            camera={{ position: [0.75, 0.15, 4.6], fov: 40 }}
          >
            <CRTScene />
          </SceneCanvas>
        </div>
      </div>
    </section>
  );
}
