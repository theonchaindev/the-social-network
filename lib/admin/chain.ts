import "server-only";
import { Connection, Keypair, PublicKey, Transaction, type Signer } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import BN from "bn.js";
import bs58 from "bs58";
import { chain } from "@/lib/chain";
import { scanHolders } from "@/lib/holders";

export { scanHolders };

const METAX = new PublicKey(chain.metaxMint);
const POOL = new PublicKey(chain.pool);
const DEV = new PublicKey(chain.devWallet);
const PAYOUT = new PublicKey(chain.payoutWallet);

export const connection = new Connection(chain.rpcUrl, "confirmed");
export const client = DynamicBondingCurveClient.create(connection, "confirmed");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ui = (raw: bigint | string | number, decimals: number) => Number(raw) / 10 ** decimals;

/** Only the payout wallet's key is ever on the server. Absent → read-only admin. */
export function payoutSigner(): Keypair | null {
  const k = process.env.PAYOUT_WALLET_KEY;
  if (!k) return null;
  const kp = Keypair.fromSecretKey(bs58.decode(k));
  if (!kp.publicKey.equals(PAYOUT)) throw new Error("PAYOUT_WALLET_KEY does not match PAYOUT_WALLET");
  return kp;
}

async function metaxBalance(owner: PublicKey) {
  try {
    const ata = getAssociatedTokenAddressSync(METAX, owner, false, TOKEN_2022_PROGRAM_ID);
    return (await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID)).amount;
  } catch {
    return BigInt(0);
  }
}

export async function readStats() {
  // Sequential, few calls: the free RPC rate-limits bursts from one IP.
  const payoutAta = getAssociatedTokenAddressSync(METAX, PAYOUT, false, TOKEN_2022_PROGRAM_ID);
  const devAta = getAssociatedTokenAddressSync(METAX, DEV, false, TOKEN_2022_PROGRAM_ID);
  const accounts = await connection.getMultipleParsedAccounts([PAYOUT, DEV, payoutAta, devAta], { commitment: "confirmed" });
  const lamports = (i: number) => (accounts.value[i]?.lamports ?? 0) / 1e9;
  const tokenAmount = (i: number) => {
    const data = accounts.value[i]?.data;
    const parsed = data && "parsed" in data ? (data.parsed as { info?: { tokenAmount?: { amount?: string } } }).info : undefined;
    return BigInt(parsed?.tokenAmount?.amount ?? "0");
  };
  await sleep(120);
  const pool = await client.state.getPool(POOL);
  await sleep(120);
  const config = pool ? await client.state.getPoolConfig(pool.poolState.config) : null;
  await sleep(120);
  const fees = await client.state.getPoolFeeBreakdown(POOL);

  const ps = pool?.poolState;
  const d = chain.metaxDecimals;
  const nz = (bn: BN) => (bn.isNeg() ? 0 : ui(bn.toString(), d));
  const threshold = config ? Number(config.migrationQuoteThreshold.toString()) : 0;
  const progress = ps && threshold ? Math.min(1, Number(ps.quoteReserve.toString()) / threshold) : 0;

  return {
    signerConfigured: !!process.env.PAYOUT_WALLET_KEY,
    wallets: {
      payout: { address: chain.payoutWallet, sol: lamports(0), metax: ui(tokenAmount(2), d) },
      dev: { address: chain.devWallet, sol: lamports(1), metax: ui(tokenAmount(3), d) },
    },
    pool: {
      address: chain.pool,
      token: chain.tokenSymbol,
      quoteInCurve: ps ? ui(ps.quoteReserve.toString(), d) : 0,
      progress,
      migrated: ps?.isMigrated ?? false,
      creatorUnclaimed: nz(fees.creator.unclaimedQuoteFee),
      creatorClaimed: nz(fees.creator.claimedQuoteFee),
      partnerUnclaimed: nz(fees.partner.unclaimedQuoteFee),
      partnerClaimed: nz(fees.partner.claimedQuoteFee),
    },
  };
}

async function send(tx: Transaction, signers: Signer[], label: string) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = signers[0].publicKey;
  tx.sign(...signers);
  const sim = await connection.simulateTransaction(tx);
  if (sim.value.err) throw new Error(`${label}: simulation failed ${JSON.stringify(sim.value.err)}`);
  const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 5 });
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

/** Claim the creator (70%) stream into the payout wallet. */
export async function claimCreator() {
  const signer = payoutSigner();
  if (!signer) throw new Error("signer not configured");
  const fees = await client.state.getPoolFeeBreakdown(POOL);
  const due = fees.creator.unclaimedQuoteFee;
  if (due.isZero() || due.isNeg()) return { claimed: 0, signature: null };
  const tx = await client.creator.claimCreatorTradingFee({
    creator: signer.publicKey, payer: signer.publicKey, pool: POOL,
    maxBaseAmount: new BN(0), maxQuoteAmount: due,
  });
  const signature = await send(tx, [signer], "claimCreatorTradingFee");
  return { claimed: ui(due.toString(), chain.metaxDecimals), signature };
}

/** Pay the payout wallet's METAx out to holders pro rata. Payer is the payout wallet itself. */
export async function distribute(minUi = 0.00001) {
  const signer = payoutSigner();
  if (!signer) throw new Error("signer not configured");
  const d = chain.metaxDecimals;
  const sourceAta = getAssociatedTokenAddressSync(METAX, signer.publicKey, false, TOKEN_2022_PROGRAM_ID);
  const pot = await metaxBalance(signer.publicKey);
  if (pot === BigInt(0)) return { pot: 0, paid: [], skipped: [], signatures: [] as string[] };

  const { holders } = await scanHolders();
  const min = BigInt(Math.round(minUi * 10 ** d));
  const plan = holders
    .map((h) => ({ owner: h.owner, amount: BigInt(Math.floor(h.share * Number(pot))) }))
    .filter((p) => p.amount >= min);

  const paid: { owner: string; amount: number; signature: string }[] = [];
  const skipped: { owner: string; reason: string }[] = [];
  const signatures: string[] = [];
  const ixFor = (p: { owner: string; amount: bigint }) => {
    const owner = new PublicKey(p.owner);
    const ata = getAssociatedTokenAddressSync(METAX, owner, false, TOKEN_2022_PROGRAM_ID);
    return [
      createAssociatedTokenAccountIdempotentInstruction(signer.publicKey, ata, owner, METAX, TOKEN_2022_PROGRAM_ID),
      createTransferCheckedInstruction(sourceAta, METAX, ata, signer.publicKey, p.amount, d, [], TOKEN_2022_PROGRAM_ID),
    ];
  };
  const sendGroup = async (group: typeof plan) => {
    const tx = new Transaction();
    group.forEach((p) => tx.add(...ixFor(p)));
    const sig = await send(tx, [signer], `payout ×${group.length}`);
    signatures.push(sig);
    group.forEach((p) => paid.push({ owner: p.owner, amount: ui(p.amount, d), signature: sig }));
  };

  for (let i = 0; i < plan.length; i += 6) {
    const group = plan.slice(i, i + 6);
    try {
      await sendGroup(group);
    } catch {
      for (const p of group) {
        try { await sendGroup([p]); }
        catch (e) { skipped.push({ owner: p.owner, reason: String(e).slice(0, 120) }); }
      }
    }
  }
  return { pot: ui(pot, d), paid, skipped, signatures, holders: holders.length, belowFloor: holders.length - plan.length };
}
