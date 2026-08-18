import path from 'node:path';
import { defineConfig } from '@prisma/client/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(import.meta.dirname, 'schema.prisma'),
  datasource: {
    url: `file:${path.join(import.meta.dirname, 'dev.db')}`,
  },
  migrate: {
    adapter() {
      const dbPath = path.join(import.meta.dirname, 'dev.db');
      return new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    },
  },
});
