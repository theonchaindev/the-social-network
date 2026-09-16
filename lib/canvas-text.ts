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

type CardSpec = {
  index: string;
  title: string;
  meta: string;
  width?: number;
  height?: number;
};

/** Draws one feature card's face: index, rule, title, meta. */
export function drawCardTexture({
  index,
  title,
  meta,
  width = 512,
  height = 672,
}: CardSpec) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const serif = fontStack("--font-playfair", "Georgia, serif");
  const mono = fontStack("--font-mono-jb", "ui-monospace, monospace");
  const pad = 52;

  ctx.clearRect(0, 0, width, height);

  // Header: index left, era right, hairline under both.
  ctx.textBaseline = "top";
  ctx.fillStyle = "#e8a33d";
  ctx.font = `500 26px ${mono}`;
  ctx.letterSpacing = "4px";
  ctx.fillText(index, pad, pad);

  ctx.fillStyle = "rgba(160,176,196,0.9)";
  ctx.font = `500 24px ${mono}`;
  ctx.textAlign = "right";
  ctx.fillText(meta.toUpperCase(), width - pad, pad + 1);
  ctx.textAlign = "left";

  ctx.strokeStyle = "rgba(151,164,182,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, pad + 54);
  ctx.lineTo(width - pad, pad + 54);
  ctx.stroke();

  // Title, set large enough to survive being drawn at ~165px on screen.
  ctx.fillStyle = "#e7eef6";
  ctx.letterSpacing = "0px";
  const fontSize = title.length > 22 ? 62 : 72;
  ctx.font = `400 ${fontSize}px ${serif}`;

  const words = title.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width - pad * 2 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);

  // Centre the title block in the space below the rule.
  const lineHeight = fontSize * 1.1;
  const top = pad + 54;
  const block = lines.length * lineHeight;
  let y = top + (height - pad - top - block) / 2;
  for (const l of lines) {
    ctx.fillText(l, pad, y);
    y += lineHeight;
  }

  return canvas;
}
