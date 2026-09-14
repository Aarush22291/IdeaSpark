import { drizzle } from "drizzle-orm/neon-http";

export const db = drizzle(process.env.DATABASE_URL as string);
export * as schema from "../db/schema";
