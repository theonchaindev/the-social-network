"use client";

import dynamic from "next/dynamic";
import { FormEvent, useRef, useState } from "react";
import { SceneCanvas } from "@/components/three/LazyCanvas";
import { SplitLines } from "@/components/ui/SplitLines";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

const CRTScene = dynamic(() => import("@/components/three/CRTScene"), {
  ssr: false,
});

export function Community() {
  const scope = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  useRevealOnScroll(scope, { stagger: 0.08, start: "top 80%" });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

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
            Invitations go out in waves. Leave an address and you join the queue
            behind everyone who was already in the room.
          </p>

          {sent ? (
            <div
              data-reveal
              className="mt-10 border border-amber/40 bg-amber/5 p-6"
              role="status"
            >
              <p className="label mb-3 text-amber">Queued</p>
              <p className="text-[14px] leading-relaxed text-cold-200">
                {email} is in the queue.
              </p>
              <p className="mt-3 text-[11px] leading-relaxed text-cold-350">
                Nothing was actually transmitted — this is a concept site with
                no backend, and the address was not stored or sent anywhere.
              </p>
            </div>
          ) : (
            <form
              data-reveal
              onSubmit={onSubmit}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <label htmlFor="email" className="sr-only-focusable label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full border border-cold-500/50 bg-transparent px-5 py-4 font-mono text-[13px] text-cold-100 outline-none transition-colors duration-500 placeholder:text-cold-350 focus:border-amber"
              />
              <MagneticButton type="submit" strength={0.2}>
                <span>Request access</span>
              </MagneticButton>
            </form>
          )}

          <p className="label mt-6 text-[10px]">
            No spam. No allocation guarantees. No exceptions.
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
