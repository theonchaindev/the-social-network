import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    /**
     * The 3D scenes and the scroll/animation hooks are deliberately imperative:
     * react-three-fiber drives three.js by mutating uniforms, textures and
     * instance matrices inside the render loop, and the GSAP hooks write to DOM
     * nodes handed in by ref. The React Compiler's immutability rule assumes
     * values never change after render, which is exactly what these layers do
     * sixty times a second, so it is switched off here and only here.
     */
    files: [
      "components/three/**/*.tsx",
      "components/ui/Preloader.tsx",
      "components/ui/SplitLines.tsx",
      "hooks/**/*.ts",
    ],
    rules: {
      "react-hooks/immutability": "off",
    },
  },
]);

export default eslintConfig;
