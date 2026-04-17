/**
 * In-memory cache of Participate-table row meta by auction engine address.
 * Survives UserDashboard unmount so returning from /user/auction/:addr still shows full rows.
 */

export const auctionListMetaByEngine = new Map();

export function pruneAuctionListMetaCache(validLowerKeys) {
  const valid = new Set(validLowerKeys);
  for (const k of auctionListMetaByEngine.keys()) {
    if (!valid.has(k)) auctionListMetaByEngine.delete(k);
  }
}

export function buildMetaFromDeployedCache(auctions) {
  if (!auctions?.length) return {};
  const o = {};
  for (const a of auctions) {
    const k = a.auctionEngineAddress?.toLowerCase();
    if (!k) continue;
    const m = auctionListMetaByEngine.get(k);
    if (m) o[k] = m;
  }
  return o;
}

/** Merge network result into the cache (same shape as UserDashboard row meta). */
export function persistMergedAuctionListMeta(validLowerKeys, mergedByKey) {
  pruneAuctionListMetaCache(validLowerKeys);
  for (const k of Object.keys(mergedByKey)) {
    const row = mergedByKey[k];
    if (row) auctionListMetaByEngine.set(k, row);
  }
}

/** Call from auction detail after a successful load so the list row is warm on back navigation. */
export function upsertAuctionListMetaFromDetail(engineAddressLower, row) {
  if (!engineAddressLower || !row || typeof row.biddingEnd !== "number") return;
  auctionListMetaByEngine.set(engineAddressLower.toLowerCase(), { ...row });
}
