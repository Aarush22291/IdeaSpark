"use server";

import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function getData() {
  const result = await db.execute(sql`select now() as now`);
  return result;
}
