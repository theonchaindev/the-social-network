"use client";

import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useMemo } from "react";
import * as THREE from "three";
import { useIsMobile, useReducedMotion } from "@/hooks/useMediaQuery";

type Props = {
  bloom?: number;
  aberration?: number;
  grain?: number;
  vignette?: number;
};

/**
 * The grade. Kept deliberately restrained — bloom carries the practicals,
 * everything else is there to take the digital edge off.
 */
export function Effects({
  bloom = 0.85,
  aberration = 0.0007,
  grain = 0.035,
  vignette = 0.5,
}: Props) {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const offset = useMemo(
    () => new THREE.Vector2(aberration, aberration * 0.6),
    [aberration],
  );

  if (reduced) return null;

  return (
    <EffectComposer multisampling={isMobile ? 0 : 2}>
      <Bloom
        intensity={bloom}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.5}
        mipmapBlur
        radius={isMobile ? 0.45 : 0.62}
      />
      {!isMobile && (
        <ChromaticAberration
          offset={offset}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
      )}
      <Noise opacity={grain} blendFunction={BlendFunction.OVERLAY} />
      <Vignette eskil={false} offset={0.24} darkness={vignette} />
    </EffectComposer>
  );
}
