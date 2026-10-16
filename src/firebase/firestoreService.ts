import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import { Transaction, DailyCommitment, GoalItem } from '../types.ts';

const TX_COLLECTION = 'transactions';
const COMM_COLLECTION = 'commitments';
const GOALS_COLLECTION = 'goals';

/**
 * Subscribe in real-time to all transactions
 */
export function subscribeTransactions(
  onUpdate: (transactions: Transaction[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const colRef = collection(db, TX_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Transaction);
      });
      // Sort newest date first
      items.sort((a, b) => b.date.localeCompare(a.date));
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, TX_COLLECTION);
    }
  );
}

/**
 * Subscribe in real-time to all commitments
 */
export function subscribeCommitments(
  onUpdate: (commitments: DailyCommitment[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const colRef = collection(db, COMM_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: DailyCommitment[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as DailyCommitment);
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, COMM_COLLECTION);
    }
  );
}

// Helper to strip undefined fields so Firestore setDoc never errors on undefined
function sanitize<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = sanitize(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result as T;
}

/**
 * Save or update a single transaction
 */
export async function syncSaveTransaction(tx: Transaction): Promise<void> {
  const docRef = doc(db, TX_COLLECTION, tx.id);
  try {
    await setDoc(docRef, sanitize(tx), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${TX_COLLECTION}/${tx.id}`);
  }
}

/**
 * Save multiple transactions in a batch (e.g. split salary or installments)
 */
export async function syncSaveMultipleTransactions(txs: Transaction[]): Promise<void> {
  if (txs.length === 0) return;
  const batch = writeBatch(db);
  txs.forEach((tx) => {
    const docRef = doc(db, TX_COLLECTION, tx.id);
    batch.set(docRef, sanitize(tx), { merge: true });
  });
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, TX_COLLECTION);
  }
}

/**
 * Delete a transaction
 */
export async function syncDeleteTransaction(id: string): Promise<void> {
  const docRef = doc(db, TX_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${TX_COLLECTION}/${id}`);
  }
}

/**
 * Save or update a commitment / emergency
 */
export async function syncSaveCommitment(comm: DailyCommitment): Promise<void> {
  const docRef = doc(db, COMM_COLLECTION, comm.id);
  try {
    await setDoc(docRef, sanitize(comm), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COMM_COLLECTION}/${comm.id}`);
  }
}

/**
 * Delete a commitment
 */
export async function syncDeleteCommitment(id: string): Promise<void> {
  const docRef = doc(db, COMM_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COMM_COLLECTION}/${id}`);
  }
}

/**
 * Clear all transactions (for Zerar Tudo)
 */
export async function syncClearAllTransactions(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, TX_COLLECTION));
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, TX_COLLECTION);
  }
}

/**
 * Clear all commitments (for Zerar Tudo)
 */
export async function syncClearAllCommitments(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, COMM_COLLECTION));
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, COMM_COLLECTION);
  }
}

/**
 * Subscribe in real-time to all goals
 */
export function subscribeGoals(
  onUpdate: (goals: GoalItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const colRef = collection(db, GOALS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: GoalItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as GoalItem);
      });
      // Sort: active first, then newest
      items.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, GOALS_COLLECTION);
    }
  );
}

/**
 * Save or update a goal
 */
export async function syncSaveGoal(goal: GoalItem): Promise<void> {
  const docRef = doc(db, GOALS_COLLECTION, goal.id);
  try {
    await setDoc(docRef, sanitize(goal), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${GOALS_COLLECTION}/${goal.id}`);
  }
}

/**
 * Delete a goal
 */
export async function syncDeleteGoal(id: string): Promise<void> {
  const docRef = doc(db, GOALS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${GOALS_COLLECTION}/${id}`);
  }
}

/**
 * Clear all goals (for Zerar Tudo)
 */
export async function syncClearAllGoals(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, GOALS_COLLECTION));
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, GOALS_COLLECTION);
  }
}

