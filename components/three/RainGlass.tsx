"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useIsMobile, useReducedMotion } from "@/hooks/useMediaQuery";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Rain on a window. The backdrop is analytic rather than a texture, so it can
 * be sampled as many times as needed: blurred across the pane, sharp inside
 * each droplet. That contrast is what reads as glass.
 */
const fragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAspect;
  uniform float uIntensity;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
  }

  vec3 backdrop(vec2 uv) {
    vec3 col = mix(vec3(0.012, 0.018, 0.03), vec3(0.03, 0.06, 0.075), uv.y);

    // Sodium practicals and cold window light, out of focus.
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      vec2 p = vec2(
        0.5 + 0.44 * sin(uTime * 0.05 + fi * 2.1),
        0.12 + 0.76 * fract(fi * 0.383 + 0.17)
      );
      float d = length((uv - p) * vec2(uAspect, 1.0));
      float glow = smoothstep(0.30, 0.0, d);
      vec3 c = mod(fi, 2.0) < 1.0
        ? vec3(0.95, 0.63, 0.24)
        : vec3(0.20, 0.42, 0.62);
      col += c * glow * glow * 0.85;
    }
    return col;
  }

  vec3 frosted(vec2 uv) {
    vec3 c = backdrop(uv);
    c += backdrop(uv + vec2(0.016, 0.006));
    c += backdrop(uv - vec2(0.016, 0.006));
    c += backdrop(uv + vec2(-0.010, 0.017));
    c += backdrop(uv + vec2(0.010, -0.017));
    return c / 5.0;
  }

  // One layer of running droplets. Returns coverage; writes the refraction.
  float dropLayer(vec2 uv, vec2 grid, float speed, float seed, out vec2 refract) {
    vec2 g = uv * grid;
    vec2 id = floor(g);
    vec2 st = fract(g) - 0.5;

    float h = hash21(id + seed);
    float h2 = hash21(id + seed + 41.7);
    if (h2 < 0.45) { refract = vec2(0.0); return 0.0; }

    float phase = fract(uTime * speed * (0.5 + h2) + h);
    // Ease the fall so drops hang, then run.
    float fall = phase * phase * (3.0 - 2.0 * phase);
    vec2 p = vec2((h - 0.5) * 0.55, 0.5 - fall);

    float r = (0.10 + h2 * 0.13);
    vec2 d = (st - p) * vec2(grid.x / grid.y, 1.0);
    float dist = length(d);
    float drop = smoothstep(r, r * 0.45, dist);

    // Trail left behind above the head of the drop.
    float trail = smoothstep(r * 0.55, 0.0, abs(d.x))
      * smoothstep(0.5, 0.0, st.y - p.y)
      * step(0.0, st.y - p.y) * 0.45;

    refract = -d * drop * 0.55;
    return clamp(drop + trail * 0.5, 0.0, 1.0);
  }

  void main() {
    vec2 uv = vUv;
    vec2 r1, r2, r3;
    float d1 = dropLayer(uv, vec2(7.0, 4.0), 0.10, 0.0, r1);
    float d2 = dropLayer(uv, vec2(13.0, 8.0), 0.16, 19.3, r2);
    float d3 = dropLayer(uv, vec2(23.0, 15.0), 0.05, 77.1, r3);

    float coverage = clamp(d1 + d2 * 0.8 + d3 * 0.5, 0.0, 1.0) * uIntensity;
    vec2 offset = (r1 + r2 * 0.8 + r3 * 0.4) * uIntensity;

    vec3 pane = frosted(uv);
    vec3 lens = backdrop(uv + offset * 0.9);

    vec3 col = mix(pane, lens, coverage);

    // Specular edge where the droplet meets the glass.
    float edge = clamp(length(offset) * 9.0, 0.0, 1.0) * coverage;
    col += vec3(0.55, 0.62, 0.72) * edge * 0.16;

    // Vignette and a cold overall grade.
    float vig = smoothstep(1.15, 0.28, length((uv - 0.5) * vec2(uAspect, 1.0)));
    col *= mix(0.32, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function RainGlass() {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { viewport, size } = useThree();
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uIntensity: { value: 1 },
    }),
    [],
  );

  useFrame((state) => {
    // Written through the material: r3f copies the `{ value }` holders when it
    // applies the `uniforms` prop, so the memoised object is not the live one.
    const m = material.current;
    if (!m) return;
    m.uniforms.uAspect.value = size.width / size.height;
    m.uniforms.uIntensity.value = isMobile ? 0.8 : 1;
    if (!reduced) m.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
      />
    </mesh>
  );
}
