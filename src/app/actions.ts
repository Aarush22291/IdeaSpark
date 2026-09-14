"use server";
import { eq } from "drizzle-orm";
import { teams } from "@/db/schema";
import { db } from "@/lib";

export async function getMyTeam(userId: string) {
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.leadUserId, userId));
  return team ?? null;
}
