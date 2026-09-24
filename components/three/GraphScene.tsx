"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Effects } from "./Effects";
import { buildSocialGraph } from "@/lib/graph";
import { ATLAS_COLS, ATLAS_ROWS, ATLAS_TILES, buildAvatarAtlas } from "@/lib/avatars";
import { seededRandom } from "@/lib/three-utils";
import { useIsMobile, useReducedMotion } from "@/hooks/useMediaQuery";

/** Shared between both shaders: our constants are authored in sRGB. */
const srgbChunk = /* glsl */ `
  vec3 srgbToLinear(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
  }
`;

/**
 * Billboards each instance in view space so every avatar faces the camera as a
 * flat circle, however the graph rotates underneath it.
 */
const avatarVertex = /* glsl */ `
  attribute vec2 aUvOffset;
  attribute float aHighlight;
  attribute float aHolder;

  uniform vec2 uTiles;

  varying vec2 vUv;
  varying vec2 vLocal;
  varying float vHighlight;
  varying float vHolder;

  void main() {
    vHolder = aHolder;
    float s = length(vec3(instanceMatrix[0][0], instanceMatrix[0][1], instanceMatrix[0][2]));
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * s;

    vUv = aUvOffset + uv / uTiles;
    vLocal = position.xy;
    vHighlight = aHighlight;

    gl_Position = projectionMatrix * mv;
  }
`;

const avatarFragment = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uDim;

  varying vec2 vUv;
  varying vec2 vLocal;
  varying float vHighlight;
  varying float vHolder;

  ${srgbChunk}

  void main() {
    float d = length(vLocal) * 2.0;
    if (d > 1.0) discard;

    // sRGB texture, so the hardware has already handed us linear values.
    vec3 col = texture2D(uAtlas, vUv).rgb;

    vec3 rimCold = srgbToLinear(vec3(0.24, 0.35, 0.46));
    vec3 rimNear = srgbToLinear(vec3(0.23, 0.35, 0.60));
    vec3 rimHot = srgbToLinear(vec3(0.91, 0.64, 0.24));
    vec3 rim = vHighlight > 0.9 ? rimHot : (vHighlight > 0.3 ? rimNear : rimCold);

    // A defined bezel rather than a broad gradient, so these read as framed
    // photographs instead of glass beads.
    float ring = smoothstep(0.84, 0.93, d) * (1.0 - smoothstep(0.97, 1.0, d));
    // A node standing for a real wallet keeps a sodium bezel even at rest.
    rim = mix(rim, rimHot, vHolder * 0.8);
    col = mix(col, rim, ring * (0.5 + 0.5 * max(step(0.3, vHighlight), vHolder)));
    col += rimHot * smoothstep(0.62, 1.0, d) * vHolder * 0.12;
    // The hovered node gets a sodium halo, not just a brighter bezel.
    col += rimHot * smoothstep(0.55, 1.0, d) * step(0.9, vHighlight) * 0.3;

    // A whisper of sheen across the top left. Any more and it becomes an orb.
    float sheen = smoothstep(0.34, 0.0, length(vLocal - vec2(-0.15, 0.16)));
    col += srgbToLinear(vec3(0.72, 0.84, 1.0)) * sheen * 0.045;

    // While one neighbourhood is live, everything else steps back.
    float lit = clamp(vHighlight, 0.0, 1.0);
    col *= mix(0.86, 1.45, lit);
    col *= mix(1.0, mix(0.2, 1.0, max(lit, vHolder * 0.55)), uDim);

    gl_FragColor = vec4(col, smoothstep(1.0, 0.93, d));
  }
`;

const edgeVertex = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aEnd;
  attribute float aT;
  attribute float aOrder;
  attribute float aHighlight;

  uniform float uProgress;

  varying float vReveal;
  varying float vHighlight;

  void main() {
    // Each edge draws itself in over a short window once its nodes exist.
    float reveal = clamp((uProgress - aOrder) / 0.12, 0.0, 1.0);
    vReveal = reveal;
    vHighlight = aHighlight;
    vec3 p = aStart + (aEnd - aStart) * (aT * reveal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const edgeFragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uHot;
  uniform float uDim;
  varying float vReveal;
  varying float vHighlight;

  void main() {
    if (vReveal <= 0.001) discard;
    vec3 col = mix(uBase, uHot, vHighlight);
    float a = mix(0.5, 1.2, vHighlight) * vReveal;
    a *= mix(1.0, mix(0.18, 1.0, vHighlight), uDim);
    gl_FragColor = vec4(col, a);
  }
`;

export type GraphHolder = { owner: string; balance: number; share: number };

type Props = {
  progress: MutableRefObject<number>;
  /** Real wallets in the coin, mapped onto the busiest nodes. */
  holders?: GraphHolder[];
  onHoverHolder?: (holder: GraphHolder | null) => void;
};

function Graph({ progress, holders = [], onHoverHolder }: Props) {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const count = isMobile ? 90 : 160;

  const graph = useMemo(() => buildSocialGraph(count), [count]);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const edgeHighlight = useRef<THREE.BufferAttribute>(null);
  const nodeHighlight = useRef<THREE.InstancedBufferAttribute>(null);
  const edgeMaterial = useRef<THREE.ShaderMaterial>(null);
  const avatarMaterial = useRef<THREE.ShaderMaterial>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const pointer = useRef({ x: 0, y: 0, active: false });

  const atlas = useMemo(() => {
    const texture = new THREE.CanvasTexture(buildAvatarAtlas());
    texture.colorSpace = THREE.SRGBColorSpace;
    // Mipmaps would average neighbouring tiles into one smudge at distance.
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 4;
    return texture;
  }, []);

  useEffect(() => () => atlas.dispose(), [atlas]);

  /** Which avatar each node wears, as a UV offset into the atlas. */
  const uvOffsets = useMemo(() => {
    const rand = seededRandom(count * 31 + 5);
    const arr = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const tile = Math.floor(rand() * ATLAS_TILES);
      arr[i * 2] = (tile % ATLAS_COLS) / ATLAS_COLS;
      arr[i * 2 + 1] = Math.floor(tile / ATLAS_COLS) / ATLAS_ROWS;
    }
    return arr;
  }, [count]);

  const nodeHighlightData = useMemo(() => new Float32Array(count), [count]);

  /**
   * Real wallets go on the highest-degree nodes, so the hubs of the drawing are
   * the people who actually hold the most. Anything past the holder count stays
   * an anonymous face.
   */
  const { holderData, nodeToHolder } = useMemo(() => {
    const data = new Float32Array(count);
    const map = new Map<number, GraphHolder>();
    const byDegree = Array.from({ length: count }, (_, i) => i).sort(
      (a, b) => graph.neighbours[b].length - graph.neighbours[a].length,
    );
    holders.slice(0, count).forEach((h, i) => {
      const node = byDegree[i];
      data[node] = 1;
      map.set(node, h);
    });
    return { holderData: data, nodeToHolder: map };
  }, [count, graph, holders]);

  const holderAttr = useRef<THREE.InstancedBufferAttribute>(null);
  useEffect(() => {
    if (!holderAttr.current) return;
    (holderAttr.current.array as Float32Array).set(holderData);
    holderAttr.current.needsUpdate = true;
  }, [holderData]);

  useEffect(() => {
    onHoverHolder?.(hovered === null ? null : (nodeToHolder.get(hovered) ?? null));
  }, [hovered, nodeToHolder, onHoverHolder]);

  const edgeBuffers = useMemo(() => {
    const { edges, positions, edgeOrder } = graph;
    const n = edges.length;
    const starts = new Float32Array(n * 2 * 3);
    const ends = new Float32Array(n * 2 * 3);
    const ts = new Float32Array(n * 2);
    const orders = new Float32Array(n * 2);
    const highlight = new Float32Array(n * 2);
    const pos = new Float32Array(n * 2 * 3);

    edges.forEach(([a, b], i) => {
      const pa = positions[a];
      const pb = positions[b];
      for (let v = 0; v < 2; v++) {
        const o = (i * 2 + v) * 3;
        starts[o] = pa.x;
        starts[o + 1] = pa.y;
        starts[o + 2] = pa.z;
        ends[o] = pb.x;
        ends[o + 1] = pb.y;
        ends[o + 2] = pb.z;
        const p = v === 0 ? pa : pb;
        pos[o] = p.x;
        pos[o + 1] = p.y;
        pos[o + 2] = p.z;
        ts[i * 2 + v] = v;
        orders[i * 2 + v] = edgeOrder[i];
      }
    });

    return { position: pos, starts, ends, ts, orders, highlight };
  }, [graph]);

  const edgeUniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uDim: { value: 0 },
      uBase: { value: new THREE.Color("#3f6f93") },
      uHot: { value: new THREE.Color("#e8a33d") },
    }),
    [],
  );

  const avatarUniforms = useMemo(
    () => ({
      uAtlas: { value: atlas },
      uTiles: { value: new THREE.Vector2(ATLAS_COLS, ATLAS_ROWS) },
      uDim: { value: 0 },
    }),
    [atlas],
  );

  // Light up the hovered node, its neighbours, and every edge between them.
  useEffect(() => {
    const neighbours = hovered !== null ? graph.neighbours[hovered] : [];
    const neighbourSet = new Set(neighbours);

    nodeHighlightData.fill(0);
    if (hovered !== null) {
      nodeHighlightData[hovered] = 1;
      neighbourSet.forEach((n) => {
        nodeHighlightData[n] = 0.6;
      });
    }
    if (nodeHighlight.current) nodeHighlight.current.needsUpdate = true;

    const attr = edgeHighlight.current;
    if (attr) {
      const arr = attr.array as Float32Array;
      arr.fill(0);
      if (hovered !== null) {
        graph.edges.forEach(([a, b], i) => {
          if (a === hovered || b === hovered) {
            arr[i * 2] = 1;
            arr[i * 2 + 1] = 1;
          }
        });
      }
      attr.needsUpdate = true;
    }
  }, [hovered, graph, nodeHighlightData]);

  const { gl, camera, size } = useThree();

  useEffect(() => {
    if (isMobile) return;
    const el = gl.domElement;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.current.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      pointer.current.active = true;
    };
    const onLeave = () => {
      pointer.current.active = false;
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [gl, isMobile]);

  useFrame((state, delta) => {
    const m = mesh.current;
    const g = group.current;
    if (!m || !g) return;

    const p = THREE.MathUtils.clamp(progress.current, 0, 1);
    // Written through the material: r3f copies the `{ value }` holders when it
    // applies the prop, so mutating the memoised object leaves this at zero.
    if (edgeMaterial.current) edgeMaterial.current.uniforms.uProgress.value = p;
    const dimTarget = hovered === null ? 0 : 1;
    if (avatarMaterial.current) {
      const u = avatarMaterial.current.uniforms.uDim;
      u.value += (dimTarget - u.value) * Math.min(1, delta * 7);
      if (edgeMaterial.current) edgeMaterial.current.uniforms.uDim.value = u.value;
    }

    const scales: number[] = [];
    for (let i = 0; i < count; i++) {
      const order = graph.nodeOrder[i];
      // Nodes arrive just ahead of the edges that connect them.
      const t = THREE.MathUtils.clamp((p - order * 0.92) / 0.08, 0, 1);
      const eased = t * t * (3 - 2 * t);
      const degree = graph.neighbours[i].length;
      const base = 0.1 + Math.min(degree, 12) * 0.03;
      const emphasis =
        i === hovered ? 1.5 : nodeHighlightData[i] > 0 ? 1.18 : 1;
      const s = base * eased * emphasis;
      scales.push(s);

      dummy.position.copy(graph.positions[i]);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;

    if (!reduced) {
      g.rotation.y += delta * 0.04;
      g.rotation.x = Math.sin(state.clock.elapsedTime * 0.14) * 0.12;
    }
    g.updateMatrixWorld();

    // The shader billboards the quads, so a geometry raycast would miss them.
    // Pick in screen space instead: project each centre and take the nearest.
    if (isMobile || !pointer.current.active) {
      if (hovered !== null && !pointer.current.active) setHovered(null);
      return;
    }

    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const tanHalfFov = Math.tan((cam.fov * Math.PI) / 360);
    let best = -1;
    let bestDistance = Infinity;

    for (let i = 0; i < count; i++) {
      if (scales[i] <= 0.001) continue;
      projected.copy(graph.positions[i]).applyMatrix4(g.matrixWorld);
      const viewDistance = cam.position.distanceTo(projected);
      projected.project(cam);
      if (projected.z > 1) continue;

      // Radius of this disc in NDC-Y units, with a little slack for the cursor.
      const radius = (scales[i] * 0.5) / (viewDistance * tanHalfFov);
      const dx = (projected.x - pointer.current.x) * aspect;
      const dy = projected.y - pointer.current.y;
      const d = Math.hypot(dx, dy);
      if (d > radius * 1.35) continue;
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }

    const next = best === -1 ? null : best;
    if (next !== hovered) setHovered(next);
  });

  return (
    <group ref={group} position={isMobile ? [0, 0.4, 0] : [2.1, 0, 0]}>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]}>
          <instancedBufferAttribute
            attach="attributes-aUvOffset"
            args={[uvOffsets, 2]}
          />
          <instancedBufferAttribute
            ref={nodeHighlight}
            attach="attributes-aHighlight"
            args={[nodeHighlightData, 1]}
          />
          <instancedBufferAttribute
            ref={holderAttr}
            attach="attributes-aHolder"
            args={[holderData, 1]}
          />
        </planeGeometry>
        <shaderMaterial
          ref={avatarMaterial}
          vertexShader={avatarVertex}
          fragmentShader={avatarFragment}
          uniforms={avatarUniforms}
          transparent
        />
      </instancedMesh>

      {/*
        Declared as JSX children rather than a prebuilt geometry object: a
        geometry handed in via the `geometry` prop is disposed on React's
        StrictMode remount and never re-uploads, so the edges render nothing.
      */}
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[edgeBuffers.position, 3]}
          />
          <bufferAttribute attach="attributes-aStart" args={[edgeBuffers.starts, 3]} />
          <bufferAttribute attach="attributes-aEnd" args={[edgeBuffers.ends, 3]} />
          <bufferAttribute attach="attributes-aT" args={[edgeBuffers.ts, 1]} />
          <bufferAttribute attach="attributes-aOrder" args={[edgeBuffers.orders, 1]} />
          <bufferAttribute
            ref={edgeHighlight}
            attach="attributes-aHighlight"
            args={[edgeBuffers.highlight, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={edgeMaterial}
          vertexShader={edgeVertex}
          fragmentShader={edgeFragment}
          uniforms={edgeUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

export default function GraphScene({ progress, holders, onHoverHolder }: Props) {
  return (
    <>
      <Graph progress={progress} holders={holders} onHoverHolder={onHoverHolder} />
      <Effects bloom={0.34} aberration={0.00035} grain={0.028} vignette={0.55} />
    </>
  );
}
