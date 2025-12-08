import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { TestCase } from '../types';

interface TDDDB extends DBSchema {
  testCases: {
    key: string;
    value: TestCase;
    indexes: { 
      'by-status': string;
      'by-iteration': string;
    };
  };
}

const DB_NAME = 'tdd-nexus-db';
const STORE_NAME = 'testCases';
const VERSION = 2; // Bump version for schema change

let dbPromise: Promise<IDBPDatabase<TDDDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<TDDDB>(DB_NAME, VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create store if it doesn't exist (initial install)
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by-status', 'status');
          store.createIndex('by-iteration', 'iteration');
        } else {
          // Upgrade logic for existing stores
          const store = transaction.objectStore(STORE_NAME);
          if (!store.indexNames.contains('by-iteration')) {
            store.createIndex('by-iteration', 'iteration');
          }
        }
      },
    });
  }
  return dbPromise;
};

export const getAllTestCases = async (): Promise<TestCase[]> => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const saveTestCase = async (testCase: TestCase): Promise<void> => {
  const db = await initDB();
  await db.put(STORE_NAME, testCase);
};

export const deleteTestCase = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};

export const bulkImportTestCases = async (testCases: TestCase[]): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  await Promise.all([
    ...testCases.map(tc => store.put(tc)),
    tx.done
  ]);
};

export const clearAllTestCases = async (): Promise<void> => {
  const db = await initDB();
  await db.clear(STORE_NAME);
};