import { fontStack } from "./canvas-text";
import { seededRandom } from "./three-utils";

export const ATLAS_COLS = 8;
export const ATLAS_ROWS = 8;
export const ATLAS_TILES = ATLAS_COLS * ATLAS_ROWS;
const TILE = 96;
/** Leaves a margin so linear filtering never samples a neighbouring tile. */
const INSET = TILE * 0.04;

/** Muted, cold-leaning grounds — a wall of 2004 profile photos, graded down. */
const GROUNDS = [
  "#2e4356",
  "#35505f",
  "#243a4d",
  "#3d4f63",
  "#46566b",
  "#2a4a4e",
  "#4a5468",
  "#5b4a3a",
  "#3a4a5e",
  "#27384a",
  "#514c5e",
  "#1f3340",
];

const INITIALS = "ABCDEFGHIJKLMNOPRSTWZ";

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) =>
    Math.round(amount > 0 ? c + (255 - c) * amount : c * (1 + amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** The generic head-and-shoulders every default avatar has ever used. */
function drawSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colour: string,
  rand: () => number,
) {
  const cx = x + size / 2;
  const headR = size * (0.185 + rand() * 0.022);
  const headY = y + size * (0.37 + rand() * 0.025);

  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders: a dome rising out of the bottom edge, as every default avatar
  // draws them. Kept clear of the head so the gap survives minification.
  ctx.beginPath();
  ctx.ellipse(
    cx,
    y + size * (1.04 + rand() * 0.05),
    size * (0.335 + rand() * 0.04),
    size * (0.4 + rand() * 0.06),
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

/** Reads as a real photograph once it is twenty pixels wide. */
function drawPhotoish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rand: () => number,
) {
  const warm = rand() > 0.5;
  const g = ctx.createLinearGradient(x, y, x + size * 0.4, y + size);
  g.addColorStop(0, warm ? "#7d5a33" : "#27566b");
  g.addColorStop(0.55, warm ? "#4a3a30" : "#2b4356");
  g.addColorStop(1, warm ? "#1d1c22" : "#1b2733");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, size, size);

  // Out-of-focus practicals behind the subject.
  for (let i = 0; i < 3; i++) {
    const bx = x + size * (0.15 + rand() * 0.7);
    const by = y + size * (0.1 + rand() * 0.5);
    const br = size * (0.1 + rand() * 0.22);
    const rg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    const tint = warm ? "245,190,110" : "150,200,235";
    rg.addColorStop(0, `rgba(${tint},${0.3 + rand() * 0.3})`);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  // Most are a person against that backdrop; a few are just the backdrop.
  if (rand() > 0.22) {
    drawSilhouette(ctx, x, y, size, `rgba(9,14,20,${0.6 + rand() * 0.28})`, rand);
  }
}

/**
 * One canvas holding every avatar variant, sampled per instance with a UV
 * offset — the graph is a single draw call, so the faces have to share a
 * texture. Mipmaps are off: at this tile size they would blend neighbouring
 * avatars into one average smudge and kill the variety at distance.
 */
export function buildAvatarAtlas(seed = 1337) {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_COLS * TILE;
  canvas.height = ATLAS_ROWS * TILE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const rand = seededRandom(seed);
  const mono = fontStack("--font-mono-jb", "ui-monospace, monospace");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < ATLAS_TILES; i++) {
    const col = i % ATLAS_COLS;
    const row = Math.floor(i / ATLAS_COLS);
    const x = col * TILE + INSET;
    const y = row * TILE + INSET;
    const size = TILE - INSET * 2;

    const ground = GROUNDS[Math.floor(rand() * GROUNDS.length)];
    const roll = rand();

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();

    if (roll < 0.18) {
      // Initials tile — the ones who never uploaded anything.
      ctx.fillStyle = ground;
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = shade(ground, 0.55);
      ctx.font = `500 ${size * 0.34}px ${mono}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const a = INITIALS[Math.floor(rand() * INITIALS.length)];
      const b = INITIALS[Math.floor(rand() * INITIALS.length)];
      ctx.fillText(`${a}${b}`, x + size / 2, y + size / 2 + size * 0.02);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    } else if (roll < 0.52) {
      drawPhotoish(ctx, x, y, size, rand);
    } else {
      ctx.fillStyle = ground;
      ctx.fillRect(x, y, size, size);
      const light = rand() > 0.32;
      drawSilhouette(
        ctx,
        x,
        y,
        size,
        light ? shade(ground, 0.58) : shade(ground, -0.62),
        rand,
      );
    }

    // Grade every tile down so nothing pops out of the palette.
    const vig = ctx.createRadialGradient(
      x + size / 2,
      y + size * 0.45,
      size * 0.3,
      x + size / 2,
      y + size * 0.5,
      size * 0.8,
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(4,7,13,0.3)");
    ctx.fillStyle = vig;
    ctx.fillRect(x, y, size, size);

    ctx.restore();
  }

  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__atlas = canvas;
  }
  return canvas;
}
