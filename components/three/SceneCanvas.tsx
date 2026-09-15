"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ReactNode, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useIsMobile, useReducedMotion } from "@/hooks/useMediaQuery";

type Props = {
  children: ReactNode;
  className?: string;
  camera?: { position: [number, number, number]; fov?: number };
  /** Extra viewport margin so a scene warms up just before it scrolls in. */
  rootMargin?: string;
  eventSource?: boolean;
};

/**
 * Drops the render resolution when frames slip, and creeps it back when they
 * recover. Hand-rolled so the hero does not have to pull in drei.
 */
function AdaptiveDpr() {
  const setDpr = useThree((state) => state.setDpr);
  // One lazily-initialised bag of mutable state: reading a ref during render to
  // seed another ref is exactly what the refs lint rule warns about.
  const tune = useRef<{
    max: number;
    current: number;
    slow: number;
    fast: number;
  } | null>(null);

  useFrame((_, delta) => {
    if (!tune.current) {
      const max = Math.min(window.devicePixelRatio, 2);
      tune.current = { max, current: max, slow: 0, fast: 0 };
    }
    const t = tune.current;

    if (delta > 1 / 45) {
      t.slow++;
      t.fast = 0;
    } else if (delta < 1 / 58) {
      t.fast++;
      t.slow = 0;
    }

    if (t.slow > 24 && t.current > 0.75) {
      t.current = Math.max(0.75, t.current - 0.25);
      t.slow = 0;
      setDpr(t.current);
    } else if (t.fast > 240 && t.current < t.max) {
      t.current = Math.min(t.max, t.current + 0.25);
      t.fast = 0;
      setDpr(t.current);
    }
  });

  return null;
}

/**
 * One canvas per scene, but the render loop only runs while the section is on
 * screen — four always-on WebGL contexts is what kills the frame budget.
 */
export function SceneCanvas({
  children,
  className,
  camera = { position: [0, 0, 5], fov: 45 },
  rootMargin = "200px",
}: Props) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  // Latches on first intersection so heavy scene graphs never build during the
  // initial page load.
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={wrapper} className={className}>
      <Canvas
        // Cap DPR on mobile; AdaptiveDpr drops it further if frames slip.
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        camera={{ ...camera, fov: camera.fov ?? 45, near: 0.1, far: 100 }}
        frameloop={visible ? "always" : "never"}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x05070d, 0);
        }}
      >
        {mounted && children}
        {!reduced && <AdaptiveDpr />}
      </Canvas>
    </div>
  );
}
