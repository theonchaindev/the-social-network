export const site = {
  name: "METAx",
  ticker: "METAx",
  tagline: "The network was always an asset.",
  sub: "METAx is a tokenized-equity hub for the world's largest connection graph. Continuous settlement, fractional ownership, on-chain proof.",
  cta: "Open a position",
  ctaSecondary: "Read the thesis",
} as const;

export const chapters = [
  {
    id: "origin",
    index: "01",
    kicker: "Chapter one",
    year: "2004",
    title: "It began as a directory.",
    body: "Two thousand faces behind a campus firewall. No feed, no market, no consequence — just the quiet realisation that a list of people, correctly ordered, is worth more than the list itself.",
    meta: ["02:14 EST", "NODES 2,041", "EDGES 6,118"],
  },
  {
    id: "scale",
    index: "02",
    kicker: "Chapter two",
    year: "2012",
    title: "Then it became weather.",
    body: "Five hundred million nodes is not a product. It is infrastructure — a system large enough that its own behaviour becomes the thing being measured. The graph stopped describing the world and started moving it.",
    meta: ["09:41 EST", "NODES 500,000,000", "EDGES 1.2e11"],
  },
  {
    id: "now",
    index: "03",
    kicker: "Chapter three",
    year: "2026",
    title: "Now it has a price.",
    body: "METAx settles exposure to that graph on-chain, around the clock, in fractions small enough to be irrelevant and a market deep enough to be not. The ledger never closes because the network never does.",
    meta: ["00:00 UTC", "SETTLEMENT 24/7", "LATENCY 400ms"],
  },
] as const;

export const stats = [
  { value: 500000000, suffix: "", label: "Nodes on the graph", note: "The number that changed the category" },
  { value: 3.41, suffix: "B", decimals: 2, label: "Daily active connections", note: "Rolling 24h, indexed" },
  { value: 24, suffix: "/7", label: "Market hours", note: "No bell, no close" },
  { value: 1.00, suffix: "", decimals: 2, prefix: "$", label: "Minimum position", note: "Fractional to eight places" },
] as const;

export const features = [
  {
    id: "settlement",
    title: "Continuous settlement",
    body: "Positions clear in seconds, every hour of every day. Weekends are not an outage.",
    meta: "T+0",
  },
  {
    id: "backing",
    title: "One-to-one attestation",
    body: "Every token maps to a custodied share. Reserve attestations publish on a fixed cadence, on-chain.",
    meta: "1:1",
  },
  {
    id: "fractional",
    title: "Fractional to eight places",
    body: "Ownership stops being a threshold. A dollar buys the same exposure as a million, scaled.",
    meta: "0.00000001",
  },
  {
    id: "custody",
    title: "Self-custody by default",
    body: "Your keys hold the position. No withdrawal window, no counterparty queue, no permission to leave.",
    meta: "NON-CUSTODIAL",
  },
  {
    id: "graph",
    title: "Graph-native analytics",
    body: "Engagement, reach and cohort decay rendered as a live network, not a quarterly slide.",
    meta: "LIVE",
  },
  {
    id: "composability",
    title: "Composable exposure",
    body: "A standard token. Lend it, pair it, collateralise it, or let it sit there doing nothing at all.",
    meta: "ERC-20",
  },
] as const;

export const timeline = [
  { year: "2004", title: "The directory", body: "A closed network opens on one campus. Membership is the product." },
  { year: "2006", title: "The feed", body: "Chronology gives way to ranking. Attention becomes an allocatable resource." },
  { year: "2008", title: "The graph", body: "Connections are formalised as a data structure. The map stops being a metaphor." },
  { year: "2012", title: "Five hundred million", body: "The network crosses the threshold where scale itself is the moat. Public markets take note." },
  { year: "2016", title: "Ambient video", body: "Bandwidth collapses the cost of presence. The feed learns to move." },
  { year: "2021", title: "The rename", body: "A company argues its own future is a layer, not an app. The market prices the argument." },
  { year: "2024", title: "Compute as strategy", body: "Capex becomes narrative. The graph is re-underwritten as a training set." },
  { year: "2026", title: "METAx", body: "Exposure moves on-chain. The ledger opens, and does not close again." },
] as const;

export const tickerItems = [
  "METAx 612.40 +1.82%",
  "24H VOL 41.2M",
  "NODES 500,000,000",
  "SETTLEMENT T+0",
  "ATTESTATION BLOCK 21,884,102",
  "RESERVE RATIO 1.0004",
  "SPREAD 4bps",
  "UPTIME 99.99%",
] as const;

export const terminalLines = [
  "$ ssh kirkland-h33 --tunnel 127.0.0.1:8080",
  "connected. 02:14 EST",
  "",
  "> graph.init({ nodes: 2041, edges: 6118 })",
  "  building adjacency list ......... ok",
  "  seeding degree distribution ..... ok",
  "",
  "> for (const n of graph.nodes) {",
  "    n.rank = pagerank(n, { damping: 0.85 });",
  "  }",
  "  converged in 47 iterations",
  "",
  "> market.open({ asset: 'METAx', hours: '24/7' })",
  "  orderbook ....................... live",
  "  attestation ..................... 1:1",
  "  settlement ...................... T+0",
  "",
  "the network never closes.",
  "_",
] as const;
