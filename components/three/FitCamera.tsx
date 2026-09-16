"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
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
 * Pulls the camera back far enough that the scene always fits, whatever the
 * panel's aspect ratio turns out to be. Hard-coding a distance works on one
 * viewport and crops on every other.
 */
export function FitCamera({ width, height, margin = 1.2, depth = 0 }: Props) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const tanHalfFov = Math.tan((cam.fov * Math.PI) / 360);
    const aspect = size.width / size.height;

    const forHeight = (height * margin) / 2 / tanHalfFov;
    const forWidth = (width * margin) / 2 / (tanHalfFov * aspect);

    cam.position.set(0, 0, depth + Math.max(forHeight, forWidth));
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height, width, height, margin, depth]);

  return null;
}
