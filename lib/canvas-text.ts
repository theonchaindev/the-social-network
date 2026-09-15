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

  ctx.fillStyle = "#e8a33d";
  ctx.font = `500 26px ${mono}`;
  ctx.textBaseline = "top";
  ctx.letterSpacing = "4px";
  ctx.fillText(index, pad, pad);

  ctx.strokeStyle = "rgba(151,164,182,0.26)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, pad + 56);
  ctx.lineTo(width - pad, pad + 56);
  ctx.stroke();

  // Title, wrapped by hand and stacked up from the meta line.
  ctx.fillStyle = "#e3ebf4";
  ctx.font = `400 42px ${serif}`;
  ctx.letterSpacing = "0px";
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

  const metaTop = height - pad - 26;
  const lineHeight = 50;
  const titleBottom = metaTop - 34;
  let y = titleBottom - lines.length * lineHeight;
  for (const l of lines) {
    ctx.fillText(l, pad, y);
    y += lineHeight;
  }

  ctx.fillStyle = "rgba(151,164,182,0.8)";
  ctx.font = `500 20px ${mono}`;
  ctx.letterSpacing = "3px";
  ctx.fillText(meta.toUpperCase(), pad, metaTop);

  return canvas;
}
