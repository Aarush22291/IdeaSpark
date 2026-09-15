import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "./index";
import { members, payments, submissions, teams } from "./schema";

export type RegistrationMember = {
  name: string;
  raNumber: string;
  netId: string;
  phoneNumber: string;
  departmentCode: string;
  facultyName: string;
  facultyPhone: string;
  facultyEmail: string;
  isLeader?: boolean;
  email?: string;
  googleId?: string;
};


export async function addMemberAtomically(
  teamId: string,
  input: RegistrationMember,
) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${teamId}))`);

    const rows = await tx
      .select({ id: members.id })
      .from(members)
      .where(eq(members.teamId, teamId));

    if (rows.length >= 4) throw new Error("Team is full (max 4 members)");

    const [member] = await tx
      .insert(members)
      .values({
        ...input,
        teamId,
        isLeader: Boolean(input.isLeader),
        attendanceCode: null,
      })
      .returning();

    return member;
  });
}

export async function removeMemberAtomically(teamId: string, memberId: string) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${teamId}))`);
    const [member] = await tx
      .select({ id: members.id, isLeader: members.isLeader })
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.teamId, teamId)))
      .limit(1);

    if (!member) throw new Error("Member not found");
    if (member.isLeader) throw new Error("The team leader cannot be removed");

    await tx.delete(members).where(eq(members.id, memberId));
    return member;
  });
}

/**
 * Registration is a single atomic unit. Unique constraints on team_name,
 * RA number, NetID and the leader identity remain the final race-condition
 * protection when requests arrive simultaneously.
 */
export async function registerTeamWithMembers(input: {
  teamName: string;
  trackId: string;
  leaderUserId: string;
  leaderEmail: string;
  leaderGoogleId?: string;
  members: RegistrationMember[];
}) {
  return db.transaction(async (tx) => {
    if (input.members.length < 2 || input.members.length > 4) {
      throw new Error("A team must contain 2 to 4 members");
    }

    const leaders = input.members.filter((member) => member.isLeader);
    if (leaders.length !== 1) throw new Error("Exactly one leader is required");

    const [team] = await tx
      .insert(teams)
      .values({
        teamName: input.teamName,
        trackId: input.trackId,
        leadUserId: input.leaderUserId,
        status: "pending",
      })
      .returning();

    const memberRows = input.members.map((member) => ({
      name: member.name,
      raNumber: member.raNumber,
      netId: member.netId,
      phoneNumber: member.phoneNumber,
      departmentCode: member.departmentCode,
      facultyName: member.facultyName,
      facultyPhone: member.facultyPhone,
      facultyEmail: member.facultyEmail,
      teamId: team.id,
      isLeader: Boolean(member.isLeader),
      email: member.isLeader ? input.leaderEmail : member.email ?? null,
      googleId: member.isLeader ? input.leaderGoogleId ?? null : member.googleId ?? null,
      attendanceCode: null,
    }));

    const createdMembers = await tx.insert(members).values(memberRows).returning();
    const [submission] = await tx.insert(submissions).values({ teamId: team.id }).returning();

    return { team, members: createdMembers, submission };
  });
}

export async function createPaymentRecord(input: {
  teamId: string;
  razorpayOrderId: string;
  amount: string;
}) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: payments.id, status: payments.status })
      .from(payments)
      .where(eq(payments.teamId, input.teamId))
      .limit(1);

    if (existing) return existing;

    const [payment] = await tx
      .insert(payments)
      .values({
        teamId: input.teamId,
        razorpayOrderId: input.razorpayOrderId,
        amount: input.amount,
        status: "created",
      })
      .returning();

    return payment;
  });
}

/** Idempotent payment finalization used by both verify and webhook handlers. */
export async function markPaymentPaidAtomically(input: {
  teamId: string;
  paymentId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  paidAt?: Date;
}) {
  return db.transaction(async (tx) => {
    const [payment] = await tx
      .update(payments)
      .set({
        status: "paid",
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature ?? null,
        paidAt: input.paidAt ?? new Date(),
      })
      .where(and(eq(payments.id, input.paymentId), eq(payments.teamId, input.teamId)))
      .returning();

    if (!payment) throw new Error("Payment not found");

    await tx
      .update(teams)
      .set({ paymentStatus: "paid", updatedAt: new Date() })
      .where(eq(teams.id, input.teamId));

    const teamMembers = await tx
      .select({ id: members.id, attendanceCode: members.attendanceCode })
      .from(members)
      .where(eq(members.teamId, input.teamId));

    for (const member of teamMembers) {
      if (!member.attendanceCode) {
        await tx
          .update(members)
          .set({ attendanceCode: randomUUID() })
          .where(eq(members.id, member.id));
      }
    }

    return payment;
  });
}
