import path from 'node:path';
import { defineConfig } from '@prisma/client/config';
import Database from 'better-sqlite3';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(import.meta.dirname, 'schema.prisma'),
  migrate: {
    adapter() {
      const dbPath = path.join(import.meta.dirname, 'dev.db');
      const sqlite = new Database(dbPath);
      const { PrismaBetterSQLite } = require('@prisma/adapter-better-sqlite3');
      return new PrismaBetterSQLite(sqlite);
    },
  },
});
