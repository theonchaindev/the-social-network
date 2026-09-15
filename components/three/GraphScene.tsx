"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Effects } from "./Effects";
import { buildSocialGraph } from "@/lib/graph";
import { useIsMobile, useReducedMotion } from "@/hooks/useMediaQuery";

const COLOR_BASE = new THREE.Color("#2f4a63");
const COLOR_NEIGHBOUR = new THREE.Color("#3b5998");
const COLOR_ACTIVE = new THREE.Color("#e8a33d");

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
  varying float vReveal;
  varying float vHighlight;

  void main() {
    if (vReveal <= 0.001) discard;
    vec3 col = mix(uBase, uHot, vHighlight);
    float a = mix(0.58, 1.0, vHighlight) * vReveal;
    gl_FragColor = vec4(col, a);
  }
`;

type Props = {
  progress: MutableRefObject<number>;
};

function Graph({ progress }: Props) {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const count = isMobile ? 90 : 160;

  const graph = useMemo(() => buildSocialGraph(count), [count]);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const highlightAttr = useRef<THREE.BufferAttribute>(null);
  const edgeMaterial = useRef<THREE.ShaderMaterial>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const scratch = useMemo(() => new THREE.Color(), []);

  /**
   * Flat buffers for the edge field. Two vertices per edge, each carrying both
   * endpoints so the vertex shader can grow the segment from start to end.
   */
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
        // `position` is unused by the shader but keep it geometrically honest
        // so bounds and raycasts mean something.
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
      uBase: { value: new THREE.Color("#3f6f93") },
      uHot: { value: COLOR_ACTIVE.clone() },
    }),
    [],
  );

  // Light up every edge touching the hovered node.
  useEffect(() => {
    const attr = highlightAttr.current;
    if (!attr) return;
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
  }, [hovered, graph]);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const neighbourSet = new Set(hovered !== null ? graph.neighbours[hovered] : []);
    for (let i = 0; i < count; i++) {
      if (i === hovered) scratch.copy(COLOR_ACTIVE);
      else if (neighbourSet.has(i)) scratch.copy(COLOR_NEIGHBOUR);
      else scratch.copy(COLOR_BASE);
      m.setColorAt(i, scratch);
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [hovered, graph, count, scratch]);

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    const p = THREE.MathUtils.clamp(progress.current, 0, 1);
    // Write through the material, not the memoised uniforms object: r3f copies
    // the `{ value }` holders when it applies the prop, so mutating the local
    // object leaves number uniforms frozen at their initial value.
    if (edgeMaterial.current) edgeMaterial.current.uniforms.uProgress.value = p;

    const neighbourSet = new Set(hovered !== null ? graph.neighbours[hovered] : []);

    for (let i = 0; i < count; i++) {
      const order = graph.nodeOrder[i];
      // Nodes pop in just ahead of the edges that connect them.
      const t = THREE.MathUtils.clamp((p - order * 0.92) / 0.08, 0, 1);
      const eased = t * t * (3 - 2 * t);
      const degree = graph.neighbours[i].length;
      const base = 0.042 + Math.min(degree, 12) * 0.013;
      const emphasis = i === hovered ? 1.55 : neighbourSet.has(i) ? 1.2 : 1;

      dummy.position.copy(graph.positions[i]);
      dummy.scale.setScalar(base * eased * emphasis);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;

    if (group.current && !reduced) {
      group.current.rotation.y += delta * 0.04;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.14) * 0.12;
    }
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (isMobile) return;
    e.stopPropagation();
    if (e.instanceId !== undefined) setHovered(e.instanceId);
  };

  return (
    <group ref={group} position={isMobile ? [0, 0.4, 0] : [2.1, 0, 0]}>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, count]}
        frustumCulled={false}
        onPointerMove={onMove}
        onPointerOut={() => setHovered(null)}
      >
        <icosahedronGeometry args={[1, isMobile ? 1 : 2]} />
        <meshPhysicalMaterial
          roughness={0.04}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.06}
          transmission={isMobile ? 0 : 0.92}
          thickness={1.1}
          ior={1.45}
          attenuationDistance={2.4}
          attenuationColor="#2b5d7a"
          envMapIntensity={2.6}
          specularIntensity={1}
          color="#dbe8f2"
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
            ref={highlightAttr}
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

export default function GraphScene({ progress }: Props) {
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} color="#9fc4e0" />
      <directionalLight position={[-5, -2, -4]} intensity={0.5} color="#e8a33d" />
      {/* Procedural env map — no HDR fetch, so nothing to lazy-load. */}
      <Environment resolution={128}>
        <Lightformer intensity={5} position={[0, 4, 3]} scale={[8, 3, 1]} color="#8ec1e6" />
        <Lightformer intensity={3} position={[-4, -2, 2]} scale={[5, 3, 1]} color="#e8a33d" />
        <Lightformer intensity={0.6} position={[3, -3, -3]} scale={[6, 6, 1]} color="#17383f" />
      </Environment>
      <Graph progress={progress} />
      <Effects bloom={0.42} aberration={0.00035} grain={0.028} vignette={0.55} />
    </>
  );
}
