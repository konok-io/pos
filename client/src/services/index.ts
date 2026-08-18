// Re-export sync status from database
export { onSyncStatusChange } from './database';

// Export localDb services
export { localDb, initDatabase, generateId, generateInvoiceNo, type Store, type Currency, type User, type SyncQueue } from './localDb';
export * from './offlineApi';
