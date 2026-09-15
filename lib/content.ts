export const site = {
  name: "METAx",
  ticker: "METAx",
  tagline: "The network was always an asset.",
  sub: "Facebook turned a list of people into the largest private map of human connection ever assembled. METAx is a concept for what it looks like when exposure to that map settles on-chain.",
  cta: "Open a position",
  ctaSecondary: "Read the thesis",
} as const;

/**
 * The three pinned chapters. Historical detail is drawn from Facebook's and
 * Meta's own disclosures and contemporaneous reporting; the 2026 chapter is
 * the fictional part.
 */
export const chapters = [
  {
    id: "origin",
    index: "01",
    kicker: "Chapter one",
    year: "2004",
    title: "It began as a directory.",
    body: "TheFacebook went live from a Kirkland House dorm room on 4 February 2004. Closed to Harvard, no feed, no advertising — and about twelve hundred students inside the first day. Within a month more than half the undergraduate population had a profile. The product was never the page. It was the list, correctly ordered.",
    meta: ["KIRKLAND HOUSE", "04 FEB 2004", "~1,200 DAY ONE"],
  },
  {
    id: "scale",
    index: "02",
    kicker: "Chapter two",
    year: "2010",
    title: "Then it became weather.",
    body: "News Feed landed in September 2006 and users organised against the very ranking that would come to define the company. Three weeks later, signup opened to anyone over thirteen. By July 2010: five hundred million accounts. At that size a network stops describing behaviour and starts setting it.",
    meta: ["NEWS FEED 2006", "OPEN SIGNUP 2006", "500,000,000"],
  },
  {
    id: "now",
    index: "03",
    kicker: "Chapter three",
    year: "2026",
    title: "Now it has a price.",
    body: "Listed at thirty-eight dollars in May 2012. A billion monthly users by that October. Renamed Meta in 2021, past a trillion dollars in 2024. METAx is the thought experiment that follows — the same exposure, cleared continuously, on a ledger with no closing bell.",
    meta: ["NASDAQ: META", "META SINCE 2021", "CONCEPT ONLY"],
  },
] as const;

export type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  note: string;
};

/** The historical record, not the fictional product. */
export const stats: Stat[] = [
  {
    value: 500000000,
    label: "Accounts, July 2010",
    note: "The number that changed the category",
  },
  {
    value: 1000000000,
    label: "Monthly actives, October 2012",
    note: "Eight years and eight months from a dorm room",
  },
  {
    value: 38,
    prefix: "$",
    decimals: 2,
    label: "IPO price, 18 May 2012",
    note: "NASDAQ. The largest tech listing to that point",
  },
  {
    value: 3.4,
    suffix: "bn",
    decimals: 1,
    label: "People using a Meta app daily",
    note: "Company-reported, 2025",
  },
];

export const features = [
  {
    id: "settlement",
    title: "Continuous settlement",
    body: "Positions would clear in seconds, every hour of every day. Equity markets keep banking hours; the network never has.",
    meta: "T+0",
  },
  {
    id: "backing",
    title: "One-to-one attestation",
    body: "Every token maps to a custodied share, with reserve attestations published on a fixed cadence, on-chain.",
    meta: "1:1",
  },
  {
    id: "fractional",
    title: "Fractional to eight places",
    body: "A share that trades in the hundreds becomes a position anyone can hold. Ownership stops being a threshold.",
    meta: "0.00000001",
  },
  {
    id: "custody",
    title: "Self-custody by default",
    body: "Your keys hold the position. No withdrawal window, no counterparty queue, no permission required to leave.",
    meta: "NON-CUSTODIAL",
  },
  {
    id: "graph",
    title: "Graph-native analytics",
    body: "Daily actives, reach and cohort decay rendered as a live network rather than a quarterly slide.",
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
  {
    year: "2004",
    title: "TheFacebook",
    body: "Launched 4 February from Kirkland House, Harvard, by Mark Zuckerberg with Eduardo Saverin, Dustin Moskovitz, Andrew McCollum and Chris Hughes. Harvard email required.",
  },
  {
    year: "2005",
    title: "The name",
    body: "Expansion runs through Columbia, Stanford and Yale, then most of American higher education. The definite article is dropped and facebook.com is bought for $200,000.",
  },
  {
    year: "2006",
    title: "News Feed",
    body: "Ranking replaces chronology on 5 September and users revolt against it within hours. Three weeks later registration opens to anyone over thirteen with an email address.",
  },
  {
    year: "2008",
    title: "Past MySpace",
    body: "Facebook overtakes MySpace in global unique visitors. The incumbent had looked unassailable two years earlier.",
  },
  {
    year: "2009",
    title: "The Like button",
    body: "One click becomes the atomic unit of preference, and the feed acquires a training signal that never stops arriving.",
  },
  {
    year: "2010",
    title: "Five hundred million",
    body: "Announced in July. Scale itself is now the moat: the graph is the only one of its kind, and it cannot be rebuilt from outside.",
  },
  {
    year: "2012",
    title: "The listing",
    body: "Instagram is bought in April for about a billion dollars. The IPO prices at $38 on 18 May. Monthly actives cross a billion on 4 October.",
  },
  {
    year: "2014",
    title: "The acquisitions",
    body: "WhatsApp for roughly $19bn in February; Oculus for about $2bn in March. One buys the messaging layer, the other a bet on the next interface.",
  },
  {
    year: "2018",
    title: "The reckoning",
    body: "Cambridge Analytica forces the question the product had deferred for a decade: what is the graph for, and who is permitted to read it?",
  },
  {
    year: "2021",
    title: "Meta",
    body: "Renamed on 28 October. A company argues in public that its own future is a layer rather than an app, and the market is asked to price the argument.",
  },
  {
    year: "2024",
    title: "A trillion dollars",
    body: "Market value passes $1tn as capital expenditure becomes the narrative and the graph is re-underwritten as a training set.",
  },
  {
    year: "2026",
    title: "METAx",
    body: "The concept in this document: exposure to all of the above, cleared on-chain, in fractions, on a ledger that never closes. It does not exist.",
  },
] as const;

export const tickerItems = [
  "CONCEPT SITE · NOT A REAL PRODUCT",
  "THEFACEBOOK LAUNCHED 04 FEB 2004",
  "500,000,000 ACCOUNTS · JUL 2010",
  "IPO $38.00 · 18 MAY 2012",
  "1,000,000,000 MONTHLY · OCT 2012",
  "RENAMED META · 28 OCT 2021",
  "SETTLEMENT T+0",
  "ATTESTATION 1:1",
] as const;

export const terminalLines = [
  "$ ssh kirkland-h33 --tunnel 127.0.0.1:8080",
  "connected. 04 feb 2004, 02:14 EST",
  "",
  "> directory.load('harvard')",
  "  parsing house facebooks ......... ok",
  "  records ......................... 1,204",
  "",
  "> for (const person of directory) {",
  "    graph.link(person, person.friends);",
  "  }",
  "  edges ........................... 6,118",
  "",
  "> market.open({ asset: 'METAx', hours: '24/7' })",
  "  orderbook ....................... live",
  "  attestation ..................... 1:1",
  "  settlement ...................... T+0",
  "",
  "-- concept build. nothing here is real. --",
  "the network never closes.",
  "_",
] as const;
