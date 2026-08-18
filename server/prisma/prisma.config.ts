import path from 'node:path';
import { defineConfig } from '@prisma/client/config';
import { PrismaLibSql } from '@prisma/adapter-libsql';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(import.meta.dirname, 'schema.prisma'),
  datasource: {
    url: `file:${path.join(import.meta.dirname, 'dev.db')}`,
  },
  migrate: {
    adapter() {
      const dbPath = path.join(import.meta.dirname, 'dev.db');
      return new PrismaLibSql({ url: `file:${dbPath}` });
    },
  },
});
