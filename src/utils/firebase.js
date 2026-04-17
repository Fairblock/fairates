import { initializeApp } from 'firebase/app';
import {
  auctionHasPersistedListMeta,
  buildListMetaFromRow,
} from './auctionListMetaFromChain.js';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  limit,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

// Firebase configuration

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

/** One Firestore document per auction; document id = lowercased auction engine address. */
export const AUCTIONS_COLLECTION = 'auctions';
const AUCTION_DOC_SCHEMA_VERSION = 2;
/** Stay under Firestore's 500 writes per batch. */
const MAX_FIRESTORE_BATCH = 450;

function normalizeAuctionEngineDocId(auctionEngineAddress) {
  if (!auctionEngineAddress || typeof auctionEngineAddress !== 'string') {
    throw new Error('Auction record requires auctionEngineAddress');
  }
  const id = auctionEngineAddress.trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(id)) {
    throw new Error(`Invalid auctionEngineAddress for Firestore id: ${auctionEngineAddress}`);
  }
  return id;
}

function stripUndefinedDeep(value) {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value
      .map((v) => stripUndefinedDeep(v))
      .filter((v) => v !== undefined);
  }
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (v === undefined) continue;
    const next = stripUndefinedDeep(v);
    if (next !== undefined) out[k] = next;
  }
  return out;
}

/**
 * Serialize an auction for a top-level Firestore document (no `undefined` values).
 */
function auctionToFirestoreFields(auction, options = {}) {
  const { preserveRegisteredAt } = options;
  const docId = normalizeAuctionEngineDocId(auction.auctionEngineAddress);

  const registeredAt =
    typeof preserveRegisteredAt === 'number'
      ? preserveRegisteredAt
      : typeof auction.registeredAt === 'number'
        ? auction.registeredAt
        : Date.now();

  const fields = {
    schemaVersion: AUCTION_DOC_SCHEMA_VERSION,
    auctionEngineAddress: docId,
    collateralManagerAddress: auction.collateralManagerAddress ?? null,
    auctionTokenAddress: auction.auctionTokenAddress ?? null,
    lendingVaultAddress: auction.lendingVaultAddress ?? null,
    bidManagerAddress: auction.bidManagerAddress ?? null,
    offerManagerAddress: auction.offerManagerAddress ?? null,
    registeredAt,
    listMeta:
      auction.listMeta && typeof auction.listMeta === 'object'
        ? stripUndefinedDeep({ ...auction.listMeta })
        : null,
  };
  return {
    ...stripUndefinedDeep(fields),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Map a Firestore auction document back to the shape used by the app (no schema noise).
 */
function firestoreDocToAuction(docSnap) {
  const id = docSnap.id;
  const data = docSnap.data() || {};
  const out = {
    auctionEngineAddress: data.auctionEngineAddress || id,
    collateralManagerAddress: data.collateralManagerAddress || undefined,
    auctionTokenAddress: data.auctionTokenAddress || undefined,
    lendingVaultAddress: data.lendingVaultAddress || undefined,
    bidManagerAddress: data.bidManagerAddress || undefined,
    offerManagerAddress: data.offerManagerAddress || undefined,
  };
  if (data.listMeta && typeof data.listMeta === 'object') {
    out.listMeta = { ...data.listMeta };
  }
  if (typeof data.registeredAt === 'number') {
    out.registeredAt = data.registeredAt;
  }
  return out;
}

/**
 * List all auctions (sorted newest bidding window first when listMeta exists).
 * @returns {Promise<Array>} Array of auction contract records
 */
export async function getContracts() {
  try {
    const colRef = collection(db, AUCTIONS_COLLECTION);
    const snap = await getDocs(colRef);
    const list = snap.docs
      .map((d) => firestoreDocToAuction(d))
      .filter((a) => a.auctionEngineAddress);

    list.sort((a, b) => {
      const ta = Number(a.listMeta?.biddingStart) || a.registeredAt || 0;
      const tb = Number(b.listMeta?.biddingStart) || b.registeredAt || 0;
      return tb - ta;
    });
    return list;
  } catch (error) {
    console.error('Error fetching auctions from Firestore:', error);
    throw error;
  }
}

async function commitBatches(operations) {
  if (!operations.length) return;
  for (let i = 0; i < operations.length; i += MAX_FIRESTORE_BATCH) {
    const batch = writeBatch(db);
    const chunk = operations.slice(i, i + MAX_FIRESTORE_BATCH);
    for (const op of chunk) {
      if (op.type === 'delete') {
        batch.delete(op.ref);
      } else if (op.type === 'set') {
        batch.set(op.ref, op.data, { merge: false });
      } else if (op.type === 'merge') {
        batch.set(op.ref, op.data, { merge: true });
      }
    }
    await batch.commit();
  }
}

/**
 * Replace the auction registry to match the given array: upserts each auction doc
 * and deletes any stored auction not present in the array.
 * @param {Array} auctions - Full list of auction records
 * @returns {Promise<void>}
 */
export async function saveContracts(auctions) {
  if (!Array.isArray(auctions)) {
    throw new TypeError('saveContracts: auctions must be an array');
  }

  try {
    const existingSnap = await getDocs(collection(db, AUCTIONS_COLLECTION));
    const existingById = new Map(
      existingSnap.docs.map((d) => [d.id, d.data() || {}]),
    );

    const wantedEntries = [];
    const wantedIds = new Set();
    for (const a of auctions) {
      if (!a?.auctionEngineAddress) continue;
      const id = normalizeAuctionEngineDocId(a.auctionEngineAddress);
      if (wantedIds.has(id)) continue;
      wantedIds.add(id);
      wantedEntries.push({ id, auction: a });
    }

    const operations = [];

    for (const id of existingById.keys()) {
      if (!wantedIds.has(id)) {
        operations.push({
          type: 'delete',
          ref: doc(db, AUCTIONS_COLLECTION, id),
        });
      }
    }

    for (const { id, auction } of wantedEntries) {
      const prev = existingById.get(id);
      const preserveRegisteredAt =
        typeof prev?.registeredAt === 'number'
          ? prev.registeredAt
          : typeof auction.registeredAt === 'number'
            ? auction.registeredAt
            : Date.now();

      operations.push({
        type: 'set',
        ref: doc(db, AUCTIONS_COLLECTION, id),
        data: auctionToFirestoreFields(auction, {
          preserveRegisteredAt,
        }),
      });
    }

    await commitBatches(operations);
  } catch (error) {
    console.error('Error saving auctions to Firestore:', error);
    throw error;
  }
}

/**
 * Patch a single auction document (merge). Use for small updates without rewriting the full list.
 * @param {string} auctionEngineAddress
 * @param {Record<string, unknown>} patch plain fields to merge (e.g. { listMeta })
 */
export async function mergeAuctionDocument(auctionEngineAddress, patch) {
  const id = normalizeAuctionEngineDocId(auctionEngineAddress);
  const ref = doc(db, AUCTIONS_COLLECTION, id);
  const cleaned =
    patch && typeof patch === 'object'
      ? stripUndefinedDeep({ ...patch })
      : {};
  await setDoc(
    ref,
    {
      ...cleaned,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * For auctions missing `listMeta`, attach it from freshly loaded row data and persist per-doc.
 * @param {Array} deployedAuctions current auction records (e.g. from context)
 * @param {Map<string, object>} metaByEngineLower row meta from chain keyed by engine address lowercased
 * @returns {Promise<boolean>} true if Firestore was updated
 */
export async function backfillMissingListMetaInFirestore(deployedAuctions, metaByEngineLower) {
  if (!deployedAuctions?.length || !metaByEngineLower?.size) return false;
  if (!deployedAuctions.some((a) => !auctionHasPersistedListMeta(a))) return false;

  const operations = [];
  for (const a of deployedAuctions) {
    const k = a.auctionEngineAddress?.toLowerCase();
    if (!k || auctionHasPersistedListMeta(a)) continue;
    const row = metaByEngineLower.get(k);
    if (!row) continue;
    const lm = buildListMetaFromRow(row);
    if (!lm) continue;
    operations.push({
      type: 'merge',
      ref: doc(db, AUCTIONS_COLLECTION, k),
      data: {
        listMeta: stripUndefinedDeep({ ...lm }),
        schemaVersion: AUCTION_DOC_SCHEMA_VERSION,
        updatedAt: serverTimestamp(),
      },
    });
  }

  if (operations.length === 0) return false;

  await commitBatches(operations);
  return true;
}

// Auction activity logging
const ACTIVITY_COLLECTION = 'auctionActivity';

/**
 * Log a bid/offer activity entry for an auction.
 *
 * @param {Object} params
 * @param {string} params.auctionEngineAddress
 * @param {"bid"|"offer"} params.type
 * @param {string} params.wallet
 * @param {string} params.txHash
 * @param {number} params.blockNumber
 * @param {Date}   params.createdAt
 */
export async function logAuctionActivity({
  auctionEngineAddress,
  type,
  wallet,
  txHash,
  blockNumber,
  createdAt,
}) {
  try {
    const colRef = collection(db, ACTIVITY_COLLECTION);
    await addDoc(colRef, {
      auctionEngineAddress: auctionEngineAddress?.toLowerCase?.() || auctionEngineAddress,
      type,
      wallet,
      txHash,
      blockNumber,
      createdAt,
    });
  } catch (error) {
    console.error('Error logging auction activity to Firestore:', error);
  }
}

/**
 * Fetch the latest activity entries for an auction.
 *
 * @param {string} auctionEngineAddress
 * @param {number} [maxItems=10]
 * @returns {Promise<Array<{type:string,wallet:string,txHash:string,createdAt:Date}>>}
 */
export async function getLatestAuctionActivity(auctionEngineAddress, maxItems = 10) {
  try {
    if (!auctionEngineAddress) return [];

    const colRef = collection(db, ACTIVITY_COLLECTION);
    const qRef = query(
      colRef,
      where('auctionEngineAddress', '==', auctionEngineAddress.toLowerCase()),
      limit(50),
    );

    const snap = await getDocs(qRef);
    const items = snap.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      const createdAtRaw = data.createdAt;
      const createdAtDate =
        createdAtRaw && typeof createdAtRaw.toDate === 'function'
          ? createdAtRaw.toDate()
          : createdAtRaw instanceof Date
            ? createdAtRaw
            : null;

      return {
        type: data.type || 'bid',
        wallet: data.wallet || '-',
        txHash: data.txHash || '',
        blockNumber: data.blockNumber || 0,
        createdAt: createdAtDate,
      };
    });

    items.sort((a, b) => {
      const at = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bt = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bt - at;
    });

    return items.slice(0, maxItems);
  } catch (error) {
    console.error('Error fetching auction activity from Firestore:', error);
    return [];
  }
}

export default app;
