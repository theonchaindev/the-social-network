/** Brand kit content. `{t}` in tweet copy is replaced by the working ticker on the page. */
export const brand = {
  name: "The Social Network",
  line: "Friendship was the interface. The list was the asset.",
  headline: "The network was always an asset.",
  site: "https://the-social-network-steel.vercel.app",
  defaultTicker: "$TSN",
  colours: [
    { name: "Ink", hex: "#05070D", use: "Ground. Everything sits on this." },
    { name: "Ink raise", hex: "#111725", use: "Panels, hover states." },
    { name: "Teal shadow", hex: "#17383F", use: "Cold shadow, depth." },
    { name: "Cold 300", hex: "#6E7D93", use: "Body copy." },
    { name: "Cold 100", hex: "#C3CCD9", use: "Headlines." },
    { name: "Amber", hex: "#E8A33D", use: "The one warm thing. Money, emphasis, the hub." },
    { name: "Amber soft", hex: "#F2C584", use: "Amber highlights." },
    { name: "2004 blue", hex: "#3B5998", use: "Sparingly. A nod, never a theme." },
  ],
  assets: [
    { file: "mark.png", label: "Mark · transparent", size: "1024 × 1024", w: 1024, h: 1024 },
    { file: "mark-dark.png", label: "Mark · on ink", size: "1024 × 1024", w: 1024, h: 1024 },
    { file: "mark.svg", label: "Mark · vector", size: "SVG", w: 256, h: 256 },
    { file: "wordmark.png", label: "Wordmark", size: "2400 × 600", w: 2400, h: 600 },
    { file: "avatar.png", label: "Profile avatar", size: "400 × 400", w: 400, h: 400 },
    { file: "x-banner.png", label: "X header", size: "1500 × 500", w: 1500, h: 500 },
    { file: "og.png", label: "Link preview", size: "1200 × 630", w: 1200, h: 630 },
    { file: "payout-card.png", label: "Payout round card", size: "1080 × 1080", w: 1080, h: 1080 },
    { file: "palette.png", label: "Palette sheet", size: "1600 × 420", w: 1600, h: 420 },
  ],
  voice: [
    "Sentence case. Short declaratives. Two beats, then stop.",
    "Cold by default; warmth is reserved for money moving.",
    "Never promise. Point at a transaction.",
    "History is stated as fact with a date. Opinion is stated as opinion.",
    "No exclamation marks. No emoji in copy. No rocket.",
  ],
  rules: [
    "No Meta or Facebook logos, marks, screenshots or UI.",
    "No stills, poster art, dialogue or music from the film. The line above is ours.",
    "METAx is Backed's ticker for the tokenised stock. It is what we pay out in, never what we are called.",
    "Every claim about payouts links to the chain.",
  ],
  tweets: [
    {
      tag: "Launch",
      text: "{t} pays its holders in Meta stock.\n\nEvery trade pays 2%. The program splits it on-chain: 70% to a payout wallet that is emptied to holders pro rata in METAx, 30% to the team.\n\nNot a promise. A transaction you can open.\n\n{site}",
    },
    {
      tag: "Thesis",
      text: "Friendship was the interface. The list was the asset.\n\nTwo thousand faces on a closed campus, ordered by nothing but who already knew whom. Everything built since has been an argument about what that ordering is worth.\n\n{t} is our answer.",
    },
    {
      tag: "Thread · 1/5",
      text: "How {t} works, in five tweets.\n\n1/ It trades on a Meteora bonding curve quoted in METAx, the tokenised Meta share. Every fee the pool takes is taken in Meta stock. Nothing gets swapped, nothing gets promised.",
    },
    {
      tag: "Thread · 2/5",
      text: "2/ The fee is 2% on every buy and sell. Meteora keeps 20% of that. The rest is split by the program itself: 70% to the payout wallet, 30% to the team. The percentage is written into the pool config and cannot be changed after launch.",
    },
    {
      tag: "Thread · 3/5",
      text: "3/ The payout wallet holds nothing but holders' money. On a schedule it snapshots every holder, drops the pool's own vault and our wallets, and sends METAx out pro rata. First-time recipients get a token account created for them.",
    },
    {
      tag: "Thread · 4/5",
      text: "4/ You do not claim. You do not stake. You hold {t} at the snapshot and Meta stock appears in your wallet. The site shows every round as it settles, with the transaction hash.",
    },
    {
      tag: "Thread · 5/5",
      text: "5/ What you own is not the feed, the app, or the vote. It is a claim on the cash a connection graph throws off, and the right to walk out of the position whenever you feel like it.\n\n{site}",
    },
    {
      tag: "Round settled",
      text: "Round {n} settled.\n\n{amount} METAx paid to {holders} holders, pro rata, in one transaction.\n\n{tx}",
    },
    {
      tag: "History hook",
      text: "4 February 2004. A directory with a login goes live from a dorm room. About twelve hundred students sign up in the first day.\n\nThe product was never the page. It was the list, correctly ordered.\n\nTwenty-two years later the list has a price. {t}",
    },
    {
      tag: "Honesty",
      text: "Things {t} will not tell you: a target price, an APY, a date the number goes up.\n\nThings it will: the fee, the split, the payout wallet, and every transaction out of it.\n\n{site}",
    },
  ],
} as const;
