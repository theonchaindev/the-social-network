"use client";

import { useCallback, useState } from "react";
import { Hero } from "@/components/sections/Hero";
import { Chapters } from "@/components/sections/Chapters";
import { Stats } from "@/components/sections/Stats";
import { Distributions } from "@/components/sections/Distributions";
import { RainTransition } from "@/components/sections/RainTransition";
import { Timeline } from "@/components/sections/Timeline";
import { Community } from "@/components/sections/Community";
import { Nav } from "@/components/ui/Nav";
import { Ticker } from "@/components/ui/Ticker";
import { LegalStrip } from "@/components/ui/LegalStrip";
import { Preloader } from "@/components/ui/Preloader";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { Spotlight } from "@/components/ui/Spotlight";
import { HardCut } from "@/components/ui/HardCut";
import { AmbientAudio } from "@/components/ui/AmbientAudio";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

export default function Home() {
  const [ready, setReady] = useState(false);
  useSmoothScroll(ready);
  const onDone = useCallback(() => setReady(true), []);

  return (
    <>
      <Preloader onDone={onDone} />
      <a
        href="#idea"
        className="sr-only-focusable fixed left-6 top-6 z-[90] bg-amber px-4 py-2 text-[12px] font-medium text-ink-deep"
      >
        Skip to content
      </a>

      <Spotlight />
      <CustomCursor />
      <HardCut />
      <Nav ready={ready} />

      <main>
        <Hero ready={ready} />
        <Chapters />
        <Stats />
        <Distributions />
        <RainTransition />
        <Timeline />
        <Community />
      </main>

      <LegalStrip />
      <AmbientAudio />
      <Ticker />
    </>
  );
}
