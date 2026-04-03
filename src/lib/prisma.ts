import { PrismaClient } from '../generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
  // During static builds on Vercel or locally, we might not have a connection string
  // For static generation, we should mock the client instead of using a broken adapter
  if (process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build') {
     return new Proxy({} as PrismaClient, {
       get(target, prop) {
         if (prop === '$connect') return async () => {};
         if (prop === '$disconnect') return async () => {};
         return new Proxy({}, {
           get(t, p) {
             return async () => { return [] };
           }
         });
       }
     });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in the environment.');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
