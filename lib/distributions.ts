import { seededRandom } from "./three-utils";

export type Payout = {
  id: string;
  /** Seconds past midnight on the site's fictional clock. */
  clock: number;
  wallet: string;
  amount: number;
  usd: number;
  hash: string;
};

/** The site runs on one fictional clock: 02:14:07, like everything else here. */
export const CLOCK_START = 2 * 3600 + 14 * 60 + 7;

const HEX = "0123456789abcdef";

function hex(rand: () => number, length: number) {
  let out = "";
  for (let i = 0; i < length; i++) out += HEX[Math.floor(rand() * 16)];
  return out;
}

export function formatClock(seconds: number) {
  const s = ((seconds % 86400) + 86400) % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

export function formatAmount(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export function formatUsd(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** One simulated payout. Amounts are long-tailed, as real distributions are. */
function makePayout(rand: () => number, clock: number): Payout {
  const tail = Math.pow(rand(), 3.1);
  const amount = 0.0008 + tail * 6.4;
  return {
    id: `${clock}-${hex(rand, 6)}`,
    clock,
    wallet: `0x${hex(rand, 4)}…${hex(rand, 4)}`,
    amount,
    usd: amount * 612.4,
    hash: `0x${hex(rand, 8)}`,
  };
}

/**
 * Deterministic starting rows. Generated with a fixed seed so the server and
 * the client render exactly the same table and hydration stays quiet — the
 * stream only starts being random after mount.
 */
export function seedPayouts(count: number) {
  const rand = seededRandom(90210);
  const rows: Payout[] = [];
  let clock = CLOCK_START;
  for (let i = 0; i < count; i++) {
    clock -= 1 + Math.floor(rand() * 4);
    rows.push(makePayout(rand, clock));
  }
  return rows;
}

/** The next row in the stream, once we are safely client-side. */
export function nextPayout(clock: number) {
  return makePayout(Math.random, clock);
}

export const DISTRIBUTION_INTERVAL = 300; // seconds on the fictional clock
