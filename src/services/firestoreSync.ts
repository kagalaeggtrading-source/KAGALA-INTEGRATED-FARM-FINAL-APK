/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export type SyncStatus = 'connected' | 'syncing' | 'offline' | 'error';

/**
 * Saves or overwrites a document in Firestore
 */
export async function syncSaveDoc<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  try {
    // Sanitize undefined fields which Firestore rejects
    const cleanData = JSON.parse(JSON.stringify(data));
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
  }
}

/**
 * Partially updates a document in Firestore
 */
export async function syncUpdateDoc<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  updates: Partial<T>
): Promise<void> {
  try {
    const cleanUpdates = JSON.parse(JSON.stringify(updates));
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${docId}`);
  }
}

/**
 * Deletes a document from Firestore
 */
export async function syncDeleteDoc(collectionName: string, docId: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${docId}`);
  }
}

/**
 * Subscribes to a full collection with onSnapshot real-time listener
 */
export function subscribeCollection<T extends { id: string }>(
  collectionName: string,
  onUpdate: (items: T[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const collRef = collection(db, collectionName);
  return onSnapshot(
    collRef,
    snapshot => {
      const items: T[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as T);
      });
      onUpdate(items);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribes to a single document with onSnapshot real-time listener
 */
export function subscribeDoc<T>(
  collectionName: string,
  docId: string,
  onUpdate: (data: T | null) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(
    docRef,
    snapshot => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as T);
      } else {
        onUpdate(null);
      }
    },
    error => {
      handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
      if (onError) onError(error);
    }
  );
}

/**
 * Batch upload / migration helper
 */
export async function batchUploadCollection<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    const batch = writeBatch(db);
    items.forEach(item => {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, JSON.parse(JSON.stringify(item)), { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
}
