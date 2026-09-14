import { avg, desc, eq } from "drizzle-orm";

import { db } from "./index";
import { attendance, evaluationRounds, members, scores, submissions, teams, tracks } from "./schema";

export async function getActiveTracks() {
  return db.select().from(tracks).where(eq(tracks.isActive, true));
}

export async function getTeamById(teamId: string) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  return team ?? null;
}

export async function getTeamMembers(teamId: string) {
  return db.select().from(members).where(eq(members.teamId, teamId));
}

export async function getTeamSubmission(teamId: string) {
  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.teamId, teamId))
    .limit(1);
  return submission ?? null;
}

export async function getTeamAttendance(teamId: string) {
  return db
    .select({
      memberId: attendance.memberId,
      eventDate: attendance.eventDate,
      scannedAt: attendance.scannedAt,
      scannedBy: attendance.scannedBy,
    })
    .from(attendance)
    .innerJoin(members, eq(attendance.memberId, members.id))
    .where(eq(members.teamId, teamId))
    .orderBy(desc(attendance.eventDate), desc(attendance.scannedAt));
}

export async function getLeaderboard() {
  return db
    .select({
      teamId: teams.id,
      teamName: teams.teamName,
      trackName: tracks.name,
      totalScore: avg(scores.score),
    })
    .from(scores)
    .innerJoin(teams, eq(scores.teamId, teams.id))
    .leftJoin(tracks, eq(teams.trackId, tracks.id))
    .where(eq(teams.paymentStatus, "paid"))
    .groupBy(teams.id, teams.teamName, tracks.name)
    .orderBy(desc(avg(scores.score)));
}

export async function getActiveRound() {
  const [round] = await db
    .select()
    .from(evaluationRounds)
    .where(eq(evaluationRounds.isActive, true))
    .limit(1);
  return round ?? null;
}
