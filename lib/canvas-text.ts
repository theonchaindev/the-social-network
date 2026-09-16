/**
 * Reads the real family name next/font generated, so textures drawn on canvas
 * match the page's type instead of falling back to a system face.
 */
export function fontStack(variable: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value ? `${value}, ${fallback}` : fallback;
}
