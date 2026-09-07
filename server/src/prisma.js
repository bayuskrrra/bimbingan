import { PrismaClient } from '@prisma/client';

// Global caching pattern untuk mencegah kebocoran koneksi di Vercel Serverless
let prisma;

if (process.env.NODE_ENV === 'production') {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  prisma = global.__prisma;
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

export default prisma;
