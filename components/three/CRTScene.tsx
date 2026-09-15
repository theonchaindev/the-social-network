"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Effects } from "./Effects";
import { fontStack } from "@/lib/canvas-text";
import { terminalLines } from "@/lib/content";
import { useIsMobile, useReducedMotion } from "@/hooks/useMediaQuery";

const SCREEN_W = 1024;
const SCREEN_H = 768;
const CHARS_PER_SECOND = 48;

const FULL_TEXT = terminalLines.join("\n");

/** Repaints the CRT canvas for a given number of revealed characters. */
function paint(
  ctx: CanvasRenderingContext2D,
  revealed: number,
  caretOn: boolean,
  mono: string,
) {
  ctx.fillStyle = "#04120f";
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // Phosphor bloom in the middle of the tube
  const glow = ctx.createRadialGradient(
    SCREEN_W / 2,
    SCREEN_H / 2,
    0,
    SCREEN_W / 2,
    SCREEN_H / 2,
    SCREEN_W * 0.7,
  );
  glow.addColorStop(0, "rgba(90,200,190,0.16)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  ctx.font = `500 25px ${mono}`;
  ctx.textBaseline = "top";

  const text = FULL_TEXT.slice(0, revealed);
  const lines = text.split("\n");
  const lineHeight = 34;
  const padX = 48;
  const padY = 44;
  // Keep the caret on screen once the listing runs past the tube.
  const maxLines = Math.floor((SCREEN_H - padY * 2) / lineHeight);
  const visible = lines.slice(Math.max(0, lines.length - maxLines));

  visible.forEach((line, i) => {
    const y = padY + i * lineHeight;
    if (line.startsWith("$") || line.startsWith(">")) ctx.fillStyle = "#e8a33d";
    else if (line.includes("....")) ctx.fillStyle = "#6f9f9a";
    else ctx.fillStyle = "#b6e3da";
    ctx.fillText(line, padX, y);
  });

  if (caretOn) {
    const lastLine = visible[visible.length - 1] ?? "";
    const y = padY + (visible.length - 1) * lineHeight;
    const x = padX + ctx.measureText(lastLine).width + 4;
    ctx.fillStyle = "#b6e3da";
    ctx.fillRect(x, y + 4, 13, 24);
  }

  // Scanlines
  ctx.fillStyle = "rgba(0,0,0,0.20)";
  for (let y = 0; y < SCREEN_H; y += 4) ctx.fillRect(0, y, SCREEN_W, 2);
}

function Monitor() {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const group = useRef<THREE.Group>(null);
  const revealed = useRef(0);
  const lastPainted = useRef(-1);
  const caret = useRef(true);
  const caretClock = useRef(0);

  const spill = useMemo(() => {
    const el = document.createElement("canvas");
    el.width = 256;
    el.height = 256;
    const c = el.getContext("2d");
    if (c) {
      // Must reach zero before the plane's edge, or the quad shows its seams.
      const g = c.createRadialGradient(128, 118, 0, 128, 118, 124);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.4, "rgba(255,255,255,0.24)");
      g.addColorStop(0.78, "rgba(255,255,255,0.04)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 256, 256);
    }
    const tex = new THREE.CanvasTexture(el);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => () => spill.dispose(), [spill]);

  const { ctx, texture, mono } = useMemo(() => {
    const canvasEl = document.createElement("canvas");
    canvasEl.width = SCREEN_W;
    canvasEl.height = SCREEN_H;
    const context = canvasEl.getContext("2d");
    const tex = new THREE.CanvasTexture(canvasEl);
    tex.colorSpace = THREE.SRGBColorSpace;
    return {
      ctx: context,
      texture: tex,
      mono: fontStack("--font-mono-jb", "ui-monospace, monospace"),
    };
  }, []);

  useEffect(() => {
    if (ctx) paint(ctx, reduced ? FULL_TEXT.length : 0, true, mono);
    texture.needsUpdate = true;
    if (reduced) revealed.current = FULL_TEXT.length;
    return () => texture.dispose();
  }, [ctx, texture, mono, reduced]);

  useFrame((state, delta) => {
    if (!ctx) return;
    const dt = Math.min(delta, 0.05);

    if (!reduced && revealed.current < FULL_TEXT.length) {
      revealed.current = Math.min(
        FULL_TEXT.length,
        revealed.current + CHARS_PER_SECOND * dt,
      );
    }

    caretClock.current += dt;
    if (caretClock.current > 0.5) {
      caretClock.current = 0;
      caret.current = !caret.current;
      lastPainted.current = -1;
    }

    const chars = Math.floor(revealed.current);
    if (chars !== lastPainted.current) {
      lastPainted.current = chars;
      paint(ctx, chars, caret.current, mono);
      texture.needsUpdate = true;
    }

    const g = group.current;
    if (g && !reduced) {
      const t = state.clock.elapsedTime;
      g.rotation.y = -0.22 + Math.sin(t * 0.18) * 0.045;
      g.rotation.x = 0.035 + Math.cos(t * 0.14) * 0.02;
      g.position.y = Math.sin(t * 0.3) * 0.02;
    } else if (g) {
      g.rotation.y = -0.22;
    }
  });

  const screenAspect = SCREEN_W / SCREEN_H;
  const screenH = 1.52;
  const screenW = screenH * screenAspect;

  return (
    <group ref={group} position={[0, -0.1, 0]} scale={isMobile ? 0.78 : 1}>
      {/* Tube housing */}
      <RoundedBox
        args={[screenW + 0.46, screenH + 0.52, 1.5]}
        radius={0.1}
        smoothness={4}
        position={[0, 0, -0.78]}
      >
        <meshStandardMaterial color="#1b1f26" roughness={0.72} metalness={0.15} />
      </RoundedBox>

      {/* Bezel */}
      <RoundedBox
        args={[screenW + 0.22, screenH + 0.26, 0.08]}
        radius={0.05}
        smoothness={4}
        position={[0, 0, 0.01]}
      >
        <meshStandardMaterial color="#0f1319" roughness={0.6} metalness={0.2} />
      </RoundedBox>

      {/* Screen */}
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[screenW, screenH, 24, 18]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      {/* Glass reflection */}
      <mesh position={[0, 0, 0.082]}>
        <planeGeometry args={[screenW, screenH]} />
        <meshBasicMaterial
          color="#8fd8cf"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Light spilling onto the desk: a radial falloff, not a flat panel */}
      <mesh position={[0, -1.12, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[screenW * 1.9, 2.4]} />
        <meshBasicMaterial
          map={spill}
          color="#3f9b8f"
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight position={[0, 0, 1.2]} intensity={4} distance={6} color="#69d6c6" />
    </group>
  );
}

export default function CRTScene() {
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[-3, 4, 4]} intensity={0.5} color="#7ea8c9" />
      <directionalLight position={[4, 1, 2]} intensity={0.35} color="#e8a33d" />
      <Monitor />
      <Effects bloom={0.75} aberration={0.0009} grain={0.04} vignette={0.7} />
    </>
  );
}
