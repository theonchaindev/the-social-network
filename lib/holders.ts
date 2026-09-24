import "server-only";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { chain } from "@/lib/chain";

export type Holder = {
  owner: string;
  /** UI units of the base token. */
  balance: number;
  /** 0–1 share of the eligible supply. */
  share: number;
};

/**
 * Who holds the token, read from the chain.
 *
 * `getProgramAccounts` with a memcmp on the mint returns every token account in
 * one call, and the public RPC does allow it for Token-2022 (unlike the indexed
 * `getTokenLargestAccounts`, which it refuses). The old approach — replaying the
 * pool's trade history — only ever found wallets that traded against the pool,
 * so anyone who received the token by transfer was invisible. It survives here
 * only as a fallback.
 */
export async function scanHolders(): Promise<{ holders: Holder[]; scannedTxs: number }> {
  const connection = new Connection(chain.rpcUrl, "confirmed");
  const client = DynamicBondingCurveClient.create(connection, "confirmed");
  const pool = new PublicKey(chain.pool);
  const token = new PublicKey(chain.tokenMint);

  const poolAccount = await client.state.getPool(pool);
  const vault = poolAccount?.poolState.baseVault;
  const vaultOwner = vault
    ? (await connection.getParsedAccountInfo(vault, "confirmed")).value
    : null;
  const vaultOwnerAddress =
    vaultOwner && "parsed" in (vaultOwner.data as object)
      ? ((vaultOwner.data as { parsed: { info?: { owner?: string } } }).parsed.info?.owner ?? null)
      : null;

  const exclude = new Set(
    [vault?.toBase58(), vaultOwnerAddress, chain.payoutWallet, chain.devWallet].filter(
      Boolean,
    ) as string[],
  );

  const accounts = await connection.getParsedProgramAccounts(TOKEN_2022_PROGRAM_ID, {
    commitment: "confirmed",
    filters: [{ memcmp: { offset: 0, bytes: token.toBase58() } }],
  });

  const byOwner = new Map<string, bigint>();
  for (const { pubkey, account } of accounts) {
    const data = account.data;
    if (!("parsed" in data)) continue;
    const info = (data as { parsed: { info?: { owner?: string; tokenAmount?: { amount?: string } } } })
      .parsed.info;
    const owner = info?.owner;
    if (!owner || exclude.has(owner) || exclude.has(pubkey.toBase58())) continue;
    const amount = BigInt(info?.tokenAmount?.amount ?? "0");
    if (amount > BigInt(0)) byOwner.set(owner, (byOwner.get(owner) ?? BigInt(0)) + amount);
  }

  const sum = [...byOwner.values()].reduce((s, v) => s + v, BigInt(0));
  const holders = [...byOwner.entries()]
    .map(([owner, balance]) => ({
      owner,
      balance: Number(balance) / 1e6,
      share: sum ? Number((balance * BigInt(1_000_000)) / sum) / 1_000_000 : 0,
    }))
    .sort((a, b) => b.balance - a.balance);

  return { holders, scannedTxs: accounts.length };
}
