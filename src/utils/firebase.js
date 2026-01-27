import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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

export default app;
