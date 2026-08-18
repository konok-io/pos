import path from 'node:path';
import { defineConfig } from '@prisma/client/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'schema.prisma'),
  migrate: {
    adapter: async () => {
      const { PrismaSQLite } = await import('@prisma/adapter-libsql');
      return new PrismaSQLite({ url: 'file:./prisma/dev.db' });
    },
  },
});
