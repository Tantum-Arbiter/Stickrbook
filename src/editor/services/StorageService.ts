/**
 * StorageService
 * 
 * Handles document persistence using IndexedDB.
 */

import type { DocumentData } from '../types';

const DB_NAME = 'PhotoEditorDB';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

export class StorageService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }

  /**
   * Save document
   */
  async saveDocument(document: DocumentData): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const documentWithMeta = {
        ...document,
        updatedAt: Date.now(),
      };

      const request = store.put(documentWithMeta);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Load document by ID
   */
  async loadDocument(id: string): Promise<DocumentData | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * List all documents
   */
  async listDocuments(): Promise<DocumentData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all documents
   */
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

/**
 * AutosaveService
 * 
 * Automatically saves document at intervals.
 */
export class AutosaveService {
  private storageService: StorageService;
  private intervalId: number | null = null;
  private saveInterval: number = 30000; // 30 seconds

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * Start autosave
   */
  start(getDocument: () => DocumentData | null): void {
    this.stop(); // Clear any existing interval

    this.intervalId = window.setInterval(async () => {
      const document = getDocument();
      if (document) {
        try {
          await this.storageService.saveDocument(document);
          console.log('Document autosaved');
        } catch (error) {
          console.error('Autosave failed:', error);
        }
      }
    }, this.saveInterval);
  }

  /**
   * Stop autosave
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Set autosave interval
   */
  setInterval(milliseconds: number): void {
    this.saveInterval = milliseconds;
  }
}

