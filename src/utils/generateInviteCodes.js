/**
 * Utility script to generate invite codes in Firebase
 * 
 * Usage:
 * 1. Set up your Firebase project and get the config
 * 2. Run this script (you can add it to a separate admin page or run it manually)
 * 
 * Example usage in browser console or admin page:
 * 
 * import { generateInviteCodes } from './utils/generateInviteCodes';
 * 
 * // Generate 10 invite codes
 * await generateInviteCodes(10);
 */

import { db } from './firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

/**
 * Generate a random invite code
 * @param {number} length - Length of the code (default: 8)
 * @returns {string} Random uppercase alphanumeric code
 */
function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars like 0, O, I, 1
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate multiple invite codes and add them to Firebase
 * @param {number} count - Number of invite codes to generate
 * @param {number} codeLength - Length of each code (default: 8)
 * @returns {Promise<Array<string>>} Array of generated invite codes
 */
export async function generateInviteCodes(count = 10, codeLength = 8) {
  const codes = [];
  
  try {
    for (let i = 0; i < count; i++) {
      let code;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 100;

      // Generate unique code
      while (!isUnique && attempts < maxAttempts) {
        code = generateRandomCode(codeLength);
        // Check if code already exists (you might want to query Firestore here)
        // For now, we'll just generate and hope for uniqueness
        // In production, you should check against existing codes
        isUnique = true;
        attempts++;
      }

      if (!isUnique) {
        console.error(`Failed to generate unique code after ${maxAttempts} attempts`);
        continue;
      }

      // Add code to Firestore
      const inviteRef = doc(db, "inviteCodes", code);
      await setDoc(inviteRef, {
        code: code,
        used: false,
        createdAt: new Date().toISOString(),
        createdBy: "admin" // You can change this to track who created it
      });

      codes.push(code);
      console.log(`Generated invite code: ${code}`);
    }

    console.log(`Successfully generated ${codes.length} invite codes:`, codes);
    return codes;
  } catch (error) {
    console.error("Error generating invite codes:", error);
    throw error;
  }
}

/**
 * Generate a single invite code
 * @param {number} codeLength - Length of the code (default: 8)
 * @returns {Promise<string>} Generated invite code
 */
export async function generateSingleInviteCode(codeLength = 8) {
  const codes = await generateInviteCodes(1, codeLength);
  return codes[0];
}
