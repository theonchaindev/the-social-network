"use client";

import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Effects } from "./Effects";
import { FitCamera } from "./FitCamera";
import { drawCardTexture } from "@/lib/canvas-text";
import { features } from "@/lib/content";
import { useIsMobile, useReducedMotion } from "@/hooks/useMediaQuery";

const CARD_W = 1.32;
const CARD_H = 1.73;
const CARD_D = 0.07;

type Props = {
  progress: MutableRefObject<number>;
  onHover?: (index: number | null) => void;
};

function Card({
  index,
  total,
  progress,
  hovered,
  setHovered,
  clearHovered,
  tilt,
}: {
  index: number;
  total: number;
  progress: MutableRefObject<number>;
  hovered: number | null;
  setHovered: (i: number) => void;
  clearHovered: (i: number) => void;
  tilt: MutableRefObject<{ x: number; y: number }>;
}) {
  const group = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const feature = features[index];

  const texture = useMemo(() => {
    const canvas = drawCardTexture({
      index: String(index + 1).padStart(2, "0"),
      title: feature.title,
      meta: feature.meta,
    });
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [index, feature]);

  useEffect(() => () => texture.dispose(), [texture]);

  // Fixed slot on a shallow arc; scroll rotates which slot is frontmost.
  const slot = useMemo(() => {
    const col = index - (total - 1) / 2;
    return {
      x: col * columnGap(isMobile),
      y: (index % 2 === 0 ? 1 : -1) * (isMobile ? 0.5 : 0.42),
      seed: index * 1.7,
    };
  }, [index, total, isMobile]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const time = state.clock.elapsedTime;
    const isHot = hovered === index;

    // Depth reorder: each card's turn at the front comes round as you scroll.
    const phase = (progress.current * total + index) % total;
    const depth = Math.cos((phase / total) * Math.PI * 2);
    const targetZ = depth * 0.85 + (isHot ? 0.7 : 0);

    const drift = reduced ? 0 : Math.sin(time * 0.5 + slot.seed) * 0.11;
    const targetY = slot.y + drift + (isHot ? 0.12 : 0);

    g.position.x += (slot.x - g.position.x) * Math.min(1, dt * 3);
    g.position.y += (targetY - g.position.y) * Math.min(1, dt * 3);
    g.position.z += (targetZ - g.position.z) * Math.min(1, dt * 2.6);

    const scale = isHot ? 1.14 : 1;
    const s = g.scale.x + (scale - g.scale.x) * Math.min(1, dt * 5);
    g.scale.setScalar(s);

    // Tilt toward the cursor, with a slow idle sway underneath it.
    const idleX = reduced ? 0 : Math.sin(time * 0.4 + slot.seed) * 0.06;
    const idleY = reduced ? 0 : Math.cos(time * 0.33 + slot.seed) * 0.08;
    const tx = -tilt.current.y * 0.34 + idleX;
    const ty = tilt.current.x * 0.46 + idleY;
    g.rotation.x += (tx - g.rotation.x) * Math.min(1, dt * 3);
    g.rotation.y += (ty - g.rotation.y) * Math.min(1, dt * 3);
  });

  return (
    <group
      ref={group}
      position={[slot.x, slot.y, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(index);
      }}
      onPointerOut={() => clearHovered(index)}
    >
      <RoundedBox args={[CARD_W, CARD_H, CARD_D]} radius={0.055} smoothness={4}>
        <meshPhysicalMaterial
          transmission={isMobile ? 0 : 1}
          thickness={1.4}
          roughness={0.16}
          ior={1.34}
          clearcoat={1}
          clearcoatRoughness={0.12}
          attenuationDistance={0.95}
          attenuationColor="#1b3c4b"
          envMapIntensity={1.35}
          color={hovered === index ? "#b3cadd" : "#90aabf"}
          opacity={isMobile ? 0.28 : 1}
          transparent={isMobile}
        />
      </RoundedBox>

      {/* Printed face, floating just proud of the glass */}
      <mesh position={[0, 0, CARD_D / 2 + 0.006]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshBasicMaterial
          map={texture}
          transparent
          depthWrite={false}
          opacity={hovered === index ? 1 : 0.82}
          toneMapped={false}
        />
      </mesh>

      {/* Edge catch-light */}
      <mesh position={[0, 0, -CARD_D / 2 - 0.01]}>
        <planeGeometry args={[CARD_W * 1.06, CARD_H * 1.04]} />
        <meshBasicMaterial
          color={hovered === index ? "#e8a33d" : "#1d3b4d"}
          transparent
          opacity={hovered === index ? 0.34 : 0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/** Horizontal gap between card slots, shared by the layout and the framing. */
function columnGap(isMobile: boolean) {
  return isMobile ? 0.84 : 1.5;
}

/** Furthest a card ever travels toward the camera: reorder plus hover lift. */
const MAX_FORWARD = 1.55;

function Deck({ progress, onHover }: Props) {
  const [hovered, setHoveredState] = useState<number | null>(null);
  const tilt = useRef({ x: 0, y: 0 });
  const { size } = useThree();
  const reduced = useReducedMotion();

  const setHovered = (i: number) => {
    setHoveredState(i);
    onHover?.(i);
  };

  // Moving between two cards fires out-then-over, and the out can land last.
  // Only the card that actually owns the hover is allowed to clear it.
  const clearHovered = (i: number) => {
    setHoveredState((cur) => {
      if (cur !== i) return cur;
      onHover?.(null);
      return null;
    });
  };

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      tilt.current.x = e.clientX / size.width - 0.5;
      tilt.current.y = e.clientY / size.height - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [size.width, size.height, reduced]);

  return (
    <group>
      {features.map((feature, i) => (
        <Card
          key={feature.id}
          index={i}
          total={features.length}
          progress={progress}
          hovered={hovered}
          setHovered={setHovered}
          clearHovered={clearHovered}
          tilt={tilt}
        />
      ))}
    </group>
  );
}

function Framing() {
  const isMobile = useIsMobile();
  const span = (features.length - 1) * columnGap(isMobile) + CARD_W;
  // Cards drift and rise on hover, so the vertical extent is more than a card.
  const height = CARD_H + (isMobile ? 1.5 : 1.3);
  return (
    <FitCamera width={span} height={height} margin={1.1} depth={MAX_FORWARD} />
  );
}

export default function GlassCardsScene({ progress, onHover }: Props) {
  return (
    <>
      <Framing />
      <ambientLight intensity={0.16} />
      <directionalLight position={[3, 5, 6]} intensity={0.9} color="#a9c8e2" />
      <directionalLight position={[-6, -1, 3]} intensity={0.7} color="#e8a33d" />
      <Environment resolution={128}>
        <Lightformer intensity={3.4} position={[0, 5, 4]} scale={[10, 3, 1]} color="#9ec8ea" />
        <Lightformer intensity={1.6} position={[-6, 0, 3]} scale={[4, 6, 1]} color="#e8a33d" />
        <Lightformer intensity={1} position={[5, -3, 2]} scale={[6, 6, 1]} color="#17383f" />
      </Environment>
      <Deck progress={progress} onHover={onHover} />
      <Effects bloom={0.34} aberration={0.00018} grain={0.026} vignette={0.5} />
    </>
  );
}
