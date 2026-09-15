"use client";

import dynamic from "next/dynamic";

/**
 * Single entry point for the canvas wrapper, so react-three-fiber and three
 * land in their own chunk instead of the page's initial JavaScript.
 */
export const SceneCanvas = dynamic(
  () => import("./SceneCanvas").then((m) => m.SceneCanvas),
  { ssr: false },
);
