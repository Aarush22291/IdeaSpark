import { db } from "./index";
import { members, submissions, teams } from "./schema";

export type RegistrationMemberInput = {
  name: string;
  raNumber: string;
  netId: string;
  phoneNumber: string;
  department:
    | "CSE"
    | "ECE"
    | "EEE"
    | "MECH"
    | "CIVIL"
    | "IT"
    | "AI_DS"
    | "BIOTECH"
    | "OTHER";
  facultyName: string;
  facultyPhone: string;
  facultyEmail: string;
  isLeader: boolean;
  email?: string;
  googleId?: string;
};

/**
 * All registration writes happen inside one transaction.
 * Postgres unique constraints remain the final concurrency guard.
 */
export async function registerTeam(
  teamName: string,
  memberInputs: RegistrationMemberInput[],
) {
  return db.transaction(async (tx) => {
    const [team] = await tx.insert(teams).values({ teamName }).returning();

    if (!team) {
      throw new Error("Team creation failed");
    }

    const insertedMembers = await tx
      .insert(members)
      .values(memberInputs.map((member) => ({ ...member, teamId: team.id })))
      .returning();

    await tx.insert(submissions).values({ teamId: team.id });

    return { team, members: insertedMembers };
  });
}
