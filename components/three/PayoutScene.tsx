"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Effects } from "./Effects";
import { ATLAS_COLS, ATLAS_ROWS, ATLAS_TILES, buildAvatarAtlas } from "@/lib/avatars";
import { fibonacciSphere, seededRandom } from "@/lib/three-utils";
import { useIsMobile, useReducedMotion } from "@/hooks/useMediaQuery";

const RADIUS = 2.75;

const srgbChunk = /* glsl */ `
  vec3 srgbToLinear(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
  }
`;

/**
 * The payout itself: a bright packet running the length of each spoke, timed
 * off a per-spoke phase so the whole fan never fires at once.
 */
const spokeVertex = /* glsl */ `
  attribute float aT;
  attribute float aPhase;
  attribute float aSpeed;

  varying float vT;
  varying float vPhase;
  varying float vSpeed;

  void main() {
    vT = aT;
    vPhase = aPhase;
    vSpeed = aSpeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const spokeFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBase;
  uniform vec3 uHot;

  varying float vT;
  varying float vPhase;
  varying float vSpeed;

  ${srgbChunk}

  void main() {
    float travel = fract(uTime * vSpeed + vPhase);
    float packet = smoothstep(0.075, 0.0, abs(vT - travel));
    // A short comet tail behind the packet.
    float tail = smoothstep(0.24, 0.0, clamp(travel - vT, 0.0, 1.0)) * 0.34;

    vec3 col = mix(srgbToLinear(uBase), srgbToLinear(uHot), max(packet, tail * 0.7));
    float alpha = 0.07 + packet * 0.95 + tail * 0.28;
    gl_FragColor = vec4(col, alpha);
  }
`;

const holderVertex = /* glsl */ `
  attribute vec2 aUvOffset;
  attribute float aPhase;
  attribute float aSpeed;

  uniform float uTime;
  uniform vec2 uTiles;

  varying vec2 vUv;
  varying vec2 vLocal;
  varying float vFlare;

  void main() {
    // Flares as the packet lands, then settles back.
    float travel = fract(uTime * aSpeed + aPhase);
    vFlare = smoothstep(0.88, 0.995, travel) * (1.0 - smoothstep(0.995, 1.0, travel));

    float s = length(vec3(instanceMatrix[0][0], instanceMatrix[0][1], instanceMatrix[0][2]));
    s *= 1.0 + vFlare * 0.34;

    vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * s;

    vUv = aUvOffset + uv / uTiles;
    vLocal = position.xy;

    gl_Position = projectionMatrix * mv;
  }
`;

const holderFragment = /* glsl */ `
  uniform sampler2D uAtlas;

  varying vec2 vUv;
  varying vec2 vLocal;
  varying float vFlare;

  ${srgbChunk}

  void main() {
    float d = length(vLocal) * 2.0;
    if (d > 1.0) discard;

    vec3 col = texture2D(uAtlas, vUv).rgb;

    vec3 rimCold = srgbToLinear(vec3(0.22, 0.32, 0.43));
    vec3 rimHot = srgbToLinear(vec3(0.91, 0.64, 0.24));
    vec3 rim = mix(rimCold, rimHot, vFlare);

    float ring = smoothstep(0.84, 0.93, d) * (1.0 - smoothstep(0.97, 1.0, d));
    col = mix(col, rim, ring * (0.5 + 0.5 * vFlare));
    col += rimHot * smoothstep(0.5, 1.0, d) * vFlare * 0.4;
    col *= mix(0.8, 1.3, vFlare);

    gl_FragColor = vec4(col, smoothstep(1.0, 0.93, d));
  }
`;

function Fan() {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const holders = isMobile ? 26 : 46;

  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const spokeMaterial = useRef<THREE.ShaderMaterial>(null);
  const holderMaterial = useRef<THREE.ShaderMaterial>(null);
  const coreMaterial = useRef<THREE.MeshBasicMaterial>(null);

  const atlas = useMemo(() => {
    const texture = new THREE.CanvasTexture(buildAvatarAtlas(4242));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 4;
    return texture;
  }, []);

  useEffect(() => () => atlas.dispose(), [atlas]);

  const data = useMemo(() => {
    const rand = seededRandom(holders * 977 + 3);
    // Front hemisphere only: spokes running away from camera read as clutter.
    const points = fibonacciSphere(holders * 2, RADIUS).filter((p) => p.z > -0.6);
    const positions = points.slice(0, holders);

    const count = positions.length;
    const spokePos = new Float32Array(count * 2 * 3);
    const spokeT = new Float32Array(count * 2);
    const spokePhase = new Float32Array(count * 2);
    const spokeSpeed = new Float32Array(count * 2);

    const uvOffsets = new Float32Array(count * 2);
    const holderPhase = new Float32Array(count);
    const holderSpeed = new Float32Array(count);

    positions.forEach((p, i) => {
      const phase = rand();
      const speed = 0.13 + rand() * 0.12;

      for (let v = 0; v < 2; v++) {
        const o = (i * 2 + v) * 3;
        const target = v === 0 ? new THREE.Vector3(0, 0, 0) : p;
        spokePos[o] = target.x;
        spokePos[o + 1] = target.y;
        spokePos[o + 2] = target.z;
        spokeT[i * 2 + v] = v;
        spokePhase[i * 2 + v] = phase;
        spokeSpeed[i * 2 + v] = speed;
      }

      const tile = Math.floor(rand() * ATLAS_TILES);
      uvOffsets[i * 2] = (tile % ATLAS_COLS) / ATLAS_COLS;
      uvOffsets[i * 2 + 1] = Math.floor(tile / ATLAS_COLS) / ATLAS_ROWS;
      holderPhase[i] = phase;
      holderSpeed[i] = speed;
    });

    return {
      count,
      positions,
      spokePos,
      spokeT,
      spokePhase,
      spokeSpeed,
      uvOffsets,
      holderPhase,
      holderSpeed,
      scales: positions.map(() => 0.24 + rand() * 0.16),
    };
  }, [holders]);

  const spokeUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBase: { value: new THREE.Color("#2f5a76") },
      uHot: { value: new THREE.Color("#f0b862") },
    }),
    [],
  );

  const holderUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAtlas: { value: atlas },
      uTiles: { value: new THREE.Vector2(ATLAS_COLS, ATLAS_ROWS) },
    }),
    [atlas],
  );

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dummy = new THREE.Object3D();
    data.positions.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.scale.setScalar(data.scales[i]);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [data]);

  useFrame((state, delta) => {
    // Written through the materials: r3f copies the `{ value }` holders when it
    // applies the prop, so the memoised objects are not the live ones.
    const t = reduced ? 0.35 : state.clock.elapsedTime;
    if (spokeMaterial.current) spokeMaterial.current.uniforms.uTime.value = t;
    if (holderMaterial.current) holderMaterial.current.uniforms.uTime.value = t;
    if (coreMaterial.current) {
      coreMaterial.current.opacity = 0.55 + Math.sin(t * 2.1) * 0.16;
    }

    const g = group.current;
    if (g && !reduced) {
      g.rotation.y += delta * 0.055;
      g.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={group}>
      {/* The contract at the centre, emptying itself outward */}
      <mesh>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshBasicMaterial ref={coreMaterial} color="#f2c584" transparent opacity={0.6} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial
          color="#e8a33d"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.spokePos, 3]} />
          <bufferAttribute attach="attributes-aT" args={[data.spokeT, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[data.spokePhase, 1]} />
          <bufferAttribute attach="attributes-aSpeed" args={[data.spokeSpeed, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={spokeMaterial}
          vertexShader={spokeVertex}
          fragmentShader={spokeFragment}
          uniforms={spokeUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, data.count]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]}>
          <instancedBufferAttribute attach="attributes-aUvOffset" args={[data.uvOffsets, 2]} />
          <instancedBufferAttribute attach="attributes-aPhase" args={[data.holderPhase, 1]} />
          <instancedBufferAttribute attach="attributes-aSpeed" args={[data.holderSpeed, 1]} />
        </planeGeometry>
        <shaderMaterial
          ref={holderMaterial}
          vertexShader={holderVertex}
          fragmentShader={holderFragment}
          uniforms={holderUniforms}
          transparent
        />
      </instancedMesh>
    </group>
  );
}

export default function PayoutScene() {
  return (
    <>
      <Fan />
      <Effects bloom={0.55} aberration={0.0004} grain={0.03} vignette={0.6} />
    </>
  );
}
