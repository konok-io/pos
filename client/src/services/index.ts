// Export localDb services
export { localDb, initDatabase, generateId, generateInvoiceNo, type Store, type Currency, type User, type SyncQueue } from './localDb';
export * from './offlineApi';

// Legacy API wrapper for backward compatibility
import { localDb } from './localDb';

export async function getSetting(key: string): Promise<string | null> {
  const value = await localDb.getSetting<string>(key);
  return value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await localDb.saveSetting(key, value);
}

export async function clearAllData(): Promise<void> {
  await localDb.clearAll();
}
