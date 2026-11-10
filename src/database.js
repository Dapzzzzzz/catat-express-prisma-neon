import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

export function createDatabase(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL belum diisi. Salin .env.example ke .env dan isi dari Neon.");
  }
  const adapter = new PrismaPg({ connectionString, max: 5, connectionTimeoutMillis: 10000 });
  return new PrismaClient({ adapter });
}
