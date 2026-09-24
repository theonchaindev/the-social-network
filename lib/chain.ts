/**
 * On-chain sources for the live payout feed. The wallet and mints are public
 * addresses; env vars let the real launch swap them without a code change.
 */
export const chain = {
  rpcUrl: process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com",
  /** Pool creator: receives the 70% fee stream and pays it out to holders. */
  payoutWallet: process.env.PAYOUT_WALLET ?? "AkoBhEVjK9QedUDtpey86rcmKpjLAcg4mk8EScmSq5ZB",
  /** Meta xStock (Backed). Hard-pinned: impostors share the name. */
  metaxMint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
  metaxDecimals: 8,
  /** The token whose holders get paid. */
  tokenMint: process.env.TOKEN_MINT ?? "FHWizkZePRW1iu8YadHwdSEBdqpzw1PHt6VepdRyHes1",
  tokenSymbol: process.env.TOKEN_SYMBOL ?? "TSNT3",
} as const;

export type PayoutRow = {
  signature: string;
  blockTime: number;
  recipient: string;
  /** Raw units (8 decimals). METAx has a scaled-UI multiplier; `ui` is what wallets show. */
  amountRaw: string;
  amountUi: number;
};

export type PayoutFeed = {
  updatedAt: number;
  /** True when the chain read failed and the rows are empty for that reason. */
  degraded?: boolean;
  metaxUsd: number | null;
  payoutWallet: string;
  rows: PayoutRow[];
  totals: {
    distributedUi: number;
    distributedUsd: number | null;
    payments: number;
    rounds: number;
    lastRoundAt: number | null;
  };
};
