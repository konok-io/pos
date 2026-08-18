import path from 'node:path';
import { defineConfig } from '@prisma/client/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(import.meta.dirname, 'schema.prisma'),
  migrate: {
    async adapter() {
      const { PrismaLibSQL } = await import('@prisma/adapter-libsql');
      return new PrismaLibSQL({ url: 'file:./prisma/dev.db' });
    },
  },
});
