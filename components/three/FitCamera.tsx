"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  /** Extent of the content that must stay in frame, in world units. */
  width: number;
  height: number;
  /** Breathing room around it. 1 = touching the edges. */
  margin?: number;
  /**
   * How far the content can travel toward the camera. Anything that moves
   * forward is magnified, so the fit has to be computed at its nearest point.
   */
  depth?: number;
};

/**
 * Keeps the camera far enough back that the scene fits its panel, whatever the
 * panel's aspect ratio turns out to be.
 *
 * Asserted every frame rather than once in an effect. React Three Fiber
 * re-applies the Canvas `camera` prop whenever the Canvas re-renders, which
 * silently clobbers a position set from an effect and leaves the shot cropped
 * until something happens to re-run it. Re-deriving it per frame costs a
 * handful of multiplications and cannot fall out of sync.
 */
export function FitCamera({ width, height, margin = 1.2, depth = 0 }: Props) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useFrame(() => {
    if (!size.width || !size.height) return;

    const cam = camera as THREE.PerspectiveCamera;
    const tanHalfFov = Math.tan((cam.fov * Math.PI) / 360);
    const aspect = size.width / size.height;

    const forHeight = (height * margin) / 2 / tanHalfFov;
    const forWidth = (width * margin) / 2 / (tanHalfFov * aspect);
    const z = depth + Math.max(forHeight, forWidth);

    if (Math.abs(cam.position.z - z) < 0.001 && cam.position.x === 0) return;

    cam.position.set(0, 0, z);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  });

  return null;
}
