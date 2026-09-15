"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { SceneCanvas } from "@/components/three/LazyCanvas";
import { SplitLines } from "@/components/ui/SplitLines";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { site } from "@/lib/content";

const GlobeScene = dynamic(() => import("@/components/three/GlobeScene"), {
  ssr: false,
});

export function Hero({ ready }: { ready: boolean }) {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden"
    >
      <SceneCanvas
        className="absolute inset-0 h-full w-full"
        camera={{ position: [0, 0, 5.6], fov: 42 }}
      >
        <GlobeScene />
      </SceneCanvas>

      {/* Sodium practical bleeding in from the top-right */}
      <div
        className="flare right-[-10%] top-[-12%] h-[42vh] w-[42vw] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(232,163,61,0.22) 0%, rgba(232,163,61,0) 70%)",
        }}
      />
      {/* Scrims: keep the copy legible against whatever the globe is doing */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[72vh] bg-gradient-to-t from-ink-deep via-ink-deep/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[70vw] bg-gradient-to-r from-ink-deep/85 via-ink-deep/35 to-transparent md:block" />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pb-20 md:px-12 md:pb-28">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="label mb-8"
        >
          <span className="text-amber">●</span>&nbsp;&nbsp;Tokenized equity · Live
          on mainnet · 02:14 EST
        </motion.p>

        <SplitLines
          as="h1"
          immediate
          play={ready}
          delay={0.25}
          stagger={0.085}
          text={site.tagline}
          className="headline max-w-[16ch] text-[clamp(2.75rem,9vw,8.5rem)] text-cold-100"
        />

        <div className="mt-10 flex flex-col gap-10 border-t border-cold-500/25 pt-8 md:flex-row md:items-end md:justify-between">
          <SplitLines
            immediate
            play={ready}
            delay={0.65}
            stagger={0.05}
            text={site.sub}
            className="max-w-[46ch] text-[15px] leading-relaxed text-cold-300 md:text-base"
          />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="flex shrink-0 flex-wrap items-center gap-4"
          >
            <MagneticButton href="#community">{site.cta}</MagneticButton>
            <MagneticButton href="#idea" variant="ghost">
              {site.ctaSecondary}
            </MagneticButton>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 1.2, delay: 1.3 }}
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
      >
        <span className="label text-[10px]">Scroll</span>
        <span className="block h-10 w-px bg-gradient-to-b from-cold-400/70 to-transparent" />
      </motion.div>
    </section>
  );
}
