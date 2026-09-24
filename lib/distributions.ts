export function formatAmount(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
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

/** HH:MM:SS UTC from a unix timestamp. */
export function formatTime(unix: number) {
  return new Date(unix * 1000).toISOString().slice(11, 19);
}

export function shortAddress(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}
