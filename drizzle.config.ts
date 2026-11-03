import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';


const isTest = process.env.NODE_ENV === 'test';

config({
  path: isTest ? '.env.test' : '.env',
  override: isTest,
});


export default defineConfig({
  schema: './src/shared/infrastructure/database/postgres/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});