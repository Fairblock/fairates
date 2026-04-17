import { ethers } from "ethers";
import AuctionEngineArtifact from "../AuctionEngine.json";
import CollateralManagerArtifact from "../CollateralManager.json";
import { displaySymbol } from "./symbolDisplay";

const ERC20_META_ABI = ["function symbol() view returns (string)"];

/** Stored on each auction in Firestore as `listMeta` (see deploy + list backfill). */
export function auctionHasPersistedListMeta(a) {
  const lm = a?.listMeta;
  if (!lm || typeof lm !== "object") return false;
  if (typeof lm.biddingStart !== "number" || typeof lm.biddingEnd !== "number") return false;
  if (typeof lm.revealEnd !== "number" || typeof lm.repaymentDue !== "number") return false;
  if (typeof lm.repaymentSymbol !== "string" || !lm.repaymentSymbol.length) return false;
  return true;
}

/** Shape persisted under `auction.listMeta` (matches {@link loadAuctionListMetaSnapshot} output). */
export function buildListMetaFromRow(row) {
  if (!row || typeof row !== "object") return null;
  if (typeof row.biddingStart !== "number" || typeof row.biddingEnd !== "number") return null;
  if (typeof row.revealEnd !== "number" || typeof row.repaymentDue !== "number") return null;
  if (typeof row.repaymentSymbol !== "string" || !row.repaymentSymbol.length) return null;
  return {
    biddingStart: row.biddingStart,
    biddingEnd: row.biddingEnd,
    revealEnd: row.revealEnd,
    repaymentDue: row.repaymentDue,
    repaymentSymbol: row.repaymentSymbol,
    collateralSymbols: Array.isArray(row.collateralSymbols) ? row.collateralSymbols : [],
    isFinalized: !!row.isFinalized,
  };
}

/**
 * One-shot read of everything the Participate table needs, for persisting on the
 * auction record in Firestore (avoids re-querying timelines/tokens for the list view).
 *
 * @param {ethers.providers.Provider} provider
 * @param {{ auctionEngineAddress: string, collateralManagerAddress?: string }} auctionEntry
 * @returns {Promise<{
 *   biddingStart: number,
 *   biddingEnd: number,
 *   revealEnd: number,
 *   repaymentDue: number,
 *   repaymentSymbol: string,
 *   collateralSymbols: string[],
 *   isFinalized: boolean
 * } | null>}
 */
export async function loadAuctionListMetaSnapshot(provider, auctionEntry) {
  const { auctionEngineAddress, collateralManagerAddress } = auctionEntry || {};
  if (!provider || !auctionEngineAddress) return null;

  const erc20For = (addr) =>
    new ethers.Contract(addr, ERC20_META_ABI, provider);

  const safeSymbol = async (addr) => {
    if (!addr) return "";
    try {
      const c = erc20For(addr);
      const sym = await c.symbol();
      if (sym && typeof sym === "string" && sym.trim().length > 0) {
        return displaySymbol(sym.trim());
      }
    } catch {
      // ignore
    }
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  };

  try {
    const ae = new ethers.Contract(
      auctionEngineAddress,
      AuctionEngineArtifact.abi,
      provider,
    );

    const [
      biddingStartBn,
      biddingEndBn,
      revealEndBn,
      repaymentDueBn,
      repaymentTokenAddress,
      isFinalized,
    ] = await Promise.all([
      ae.biddingStart(),
      ae.biddingEnd(),
      ae.revealEnd(),
      ae.repaymentDue(),
      ae.repaymentToken(),
      ae.isFinalized(),
    ]);

    let collateralSymbols = [];
    if (collateralManagerAddress) {
      try {
        const cm = new ethers.Contract(
          collateralManagerAddress,
          CollateralManagerArtifact.abi,
          provider,
        );
        const collateralTokens = await cm.getAcceptedCollateralTokens();
        collateralSymbols = await Promise.all(collateralTokens.map(safeSymbol));
      } catch (cmErr) {
        console.error("loadAuctionListMetaSnapshot collateral", cmErr);
      }
    }

    const repaymentSymbol = await safeSymbol(repaymentTokenAddress);

    return {
      biddingStart: biddingStartBn.toNumber(),
      biddingEnd: biddingEndBn.toNumber(),
      revealEnd: revealEndBn.toNumber(),
      repaymentDue: repaymentDueBn.toNumber(),
      repaymentSymbol,
      collateralSymbols,
      isFinalized: !!isFinalized,
    };
  } catch (e) {
    console.error("loadAuctionListMetaSnapshot", e);
    return null;
  }
}
