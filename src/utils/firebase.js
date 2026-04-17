import { initializeApp } from 'firebase/app';
import {
  auctionHasPersistedListMeta,
  buildListMetaFromRow,
} from './auctionListMetaFromChain.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
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

// Contract operations
const CONTRACTS_COLLECTION = 'contracts';
const CONTRACTS_DOC_ID = 'auctions';

/**
 * Get all contracts from Firestore
 * @returns {Promise<Array>} Array of auction contracts
 */
export async function getContracts() {
  try {
    const contractsRef = doc(db, CONTRACTS_COLLECTION, CONTRACTS_DOC_ID);
    const contractsSnap = await getDoc(contractsRef);
    
    if (contractsSnap.exists()) {
      const data = contractsSnap.data();
      return data.auctions || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching contracts from Firestore:', error);
    throw error;
  }
}

/**
 * Save contracts to Firestore
 * @param {Array} auctions - Array of auction contracts to save
 * @returns {Promise<void>}
 */
export async function saveContracts(auctions) {
  try {
    const contractsRef = doc(db, CONTRACTS_COLLECTION, CONTRACTS_DOC_ID);
    await setDoc(contractsRef, { auctions }, { merge: false });
  } catch (error) {
    console.error('Error saving contracts to Firestore:', error);
    throw error;
  }
}

/**
 * For auctions missing `listMeta`, attach it from freshly loaded row data and save once.
 * @param {Array} deployedAuctions current auction records (e.g. from context)
 * @param {Map<string, object>} metaByEngineLower row meta from chain keyed by engine address lowercased
 * @returns {Promise<boolean>} true if Firestore was updated
 */
export async function backfillMissingListMetaInFirestore(deployedAuctions, metaByEngineLower) {
  if (!deployedAuctions?.length || !metaByEngineLower?.size) return false;
  if (!deployedAuctions.some((a) => !auctionHasPersistedListMeta(a))) return false;
  let changed = false;
  const updated = deployedAuctions.map((a) => {
    const k = a.auctionEngineAddress?.toLowerCase();
    if (!k || auctionHasPersistedListMeta(a)) return a;
    const row = metaByEngineLower.get(k);
    if (!row) return a;
    const lm = buildListMetaFromRow(row);
    if (!lm) return a;
    changed = true;
    return { ...a, listMeta: lm };
  });
  if (!changed) return false;
  await saveContracts(updated);
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
