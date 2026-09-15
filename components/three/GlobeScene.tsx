"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Effects } from "./Effects";
import {
  fibonacciSphere,
  nearestNeighbourEdges,
  PulseField,
  seededRandom,
} from "@/lib/three-utils";
import { useIsMobile, useReducedMotion } from "@/hooks/useMediaQuery";

const PULSES = 3;
const RADIUS = 2.05;

/**
 * Shared GLSL: distance from a node to each expanding pulse ring, on the
 * sphere's surface (angular, not euclidean, so rings stay circular).
 */
const pulseChunk = /* glsl */ `
  uniform vec4 uPulses[${PULSES}];
  uniform float uPulseWidth;

  float pulseBrightness(vec3 dir) {
    float b = 0.0;
    for (int i = 0; i < ${PULSES}; i++) {
      float ang = acos(clamp(dot(dir, uPulses[i].xyz), -1.0, 1.0));
      float d = abs(ang - uPulses[i].w);
      float hit = 1.0 - smoothstep(0.0, uPulseWidth, d);
      float life = 1.0 - smoothstep(2.0, 3.2, uPulses[i].w);
      b = max(b, hit * life);
    }
    return b;
  }
`;

const nodeVertex = /* glsl */ `
  attribute float aSeed;
  ${pulseChunk}
  varying float vBright;
  varying float vSeed;

  void main() {
    vec3 instOrigin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
    vec3 dir = normalize(instOrigin);
    vBright = pulseBrightness(dir);
    vSeed = aSeed;

    // Nodes swell slightly as the pulse passes through them.
    vec4 local = vec4(position * (1.0 + vBright * 1.05), 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * local;
  }
`;

const nodeFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBase;
  uniform vec3 uHot;
  varying float vBright;
  varying float vSeed;

  void main() {
    float twinkle = 0.55 + 0.45 * sin(uTime * 1.1 + vSeed * 53.0);
    vec3 col = mix(uBase * twinkle, uHot, vBright);
    gl_FragColor = vec4(col, mix(0.30, 0.88, vBright));
  }
`;

const edgeVertex = /* glsl */ `
  ${pulseChunk}
  varying float vBright;

  void main() {
    vBright = pulseBrightness(normalize(position));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const edgeFragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uHot;
  varying float vBright;

  void main() {
    vec3 col = mix(uBase, uHot, vBright);
    gl_FragColor = vec4(col, mix(0.08, 0.6, vBright));
  }
`;

function Globe() {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const nodeCount = isMobile ? 1400 : 2400;

  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const pulses = useMemo(() => new PulseField(PULSES), []);
  const tilt = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const spin = useRef(0);
  const nodeMaterial = useRef<THREE.ShaderMaterial>(null);
  const edgeMaterial = useRef<THREE.ShaderMaterial>(null);

  const { nodes, edges } = useMemo(() => {
    const pts = fibonacciSphere(nodeCount, RADIUS);
    return {
      nodes: pts,
      edges: nearestNeighbourEdges(pts, {
        sample: isMobile ? 260 : 520,
        k: 2,
        maxDistance: RADIUS * 0.34,
      }),
    };
  }, [nodeCount, isMobile]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPulses: { value: pulses.uniform },
      uPulseWidth: { value: 0.055 },
      uBase: { value: new THREE.Color("#456c8a") },
      uHot: { value: new THREE.Color("#e8a33d") },
    }),
    [pulses],
  );

  const edgeUniforms = useMemo(
    () => ({
      uPulses: { value: pulses.uniform },
      uPulseWidth: { value: 0.055 },
      uBase: { value: new THREE.Color("#22415a") },
      uHot: { value: new THREE.Color("#c9862f") },
    }),
    [pulses],
  );

  const { seeds, scales } = useMemo(() => {
    const rand = seededRandom(nodeCount * 7919 + 13);
    const seedArr = new Float32Array(nodeCount);
    const scaleArr = new Float32Array(nodeCount);
    for (let i = 0; i < nodeCount; i++) {
      seedArr[i] = rand();
      scaleArr[i] = 0.55 + rand() * 0.7;
    }
    return { seeds: seedArr, scales: scaleArr };
  }, [nodeCount]);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dummy = new THREE.Object3D();
    nodes.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.scale.setScalar(scales[i]);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [nodes, scales]);

  const { size } = useThree();
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      tilt.current.tx = (e.clientY / size.height - 0.5) * 0.42;
      tilt.current.ty = (e.clientX / size.width - 0.5) * 0.62;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [size.width, size.height, reduced]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!reduced) pulses.update(dt);
    // r3f copies the `{ value }` holders when applying the `uniforms` prop, so
    // scalar uniforms have to be written through the material itself.
    if (nodeMaterial.current) {
      nodeMaterial.current.uniforms.uTime.value = state.clock.elapsedTime;
      nodeMaterial.current.uniforms.uPulses.value = pulses.uniform;
    }
    if (edgeMaterial.current) {
      edgeMaterial.current.uniforms.uPulses.value = pulses.uniform;
    }

    const g = group.current;
    if (!g) return;

    // Inertia: the globe chases the cursor rather than tracking it.
    const t = tilt.current;
    t.x += (t.tx - t.x) * Math.min(1, dt * 1.6);
    t.y += (t.ty - t.y) * Math.min(1, dt * 1.6);
    if (!reduced) spin.current += dt * 0.045;
    g.rotation.x = t.x;
    g.rotation.y = spin.current + t.y;
    g.rotation.z = t.y * 0.08;
    g.position.x = t.y * 0.35;
    g.position.y = -t.x * 0.35;

    // Slow dolly + parallax drift. Portrait viewports need a longer lens or the
    // globe crops to a handful of nodes.
    const baseZ = isMobile ? 8.6 : 5.6;
    const e = state.clock.elapsedTime;
    state.camera.position.z = baseZ + (reduced ? 0 : Math.sin(e * 0.11) * 0.35);
    state.camera.position.x = reduced ? 0 : Math.sin(e * 0.07) * 0.22;
    state.camera.position.y = reduced ? 0 : Math.cos(e * 0.09) * 0.14;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, nodeCount]}
        frustumCulled={false}
      >
        <octahedronGeometry args={[0.018, 0]}>
          <instancedBufferAttribute
            attach="attributes-aSeed"
            args={[seeds, 1]}
          />
        </octahedronGeometry>
        <shaderMaterial
          ref={nodeMaterial}
          vertexShader={nodeVertex}
          fragmentShader={nodeFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* JSX geometry, not a `geometry` prop: a prebuilt geometry object is
          disposed on React's StrictMode remount and never re-uploads. */}
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
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

      {/* Cold rim light reading as atmosphere behind the node field */}
      <mesh scale={2.45}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#12303f"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function SceneFog() {
  const isMobile = useIsMobile();
  return (
    <fog attach="fog" args={["#05070d", isMobile ? 9 : 6.5, isMobile ? 14 : 11]} />
  );
}

/** Sits the globe up and to the right so the headline lands on darker ground. */
function GlobePlacement() {
  const isMobile = useIsMobile();
  return (
    <group
      position={isMobile ? [0, 0.75, 0] : [0.9, 0.5, 0]}
      scale={isMobile ? 1 : 0.96}
    >
      <Globe />
    </group>
  );
}

export default function GlobeScene() {
  return (
    <>
      <color attach="background" args={["#05070d"]} />
      <SceneFog />
      <GlobePlacement />
      <Effects bloom={0.5} aberration={0.0008} grain={0.03} vignette={0.62} />
    </>
  );
}
