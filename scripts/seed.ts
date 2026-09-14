import "dotenv/config";

import { db } from "../src/db";
import { admins, eventConfig } from "../src/db/schema";

async function main() {
  const registrationDeadline = process.env.REGISTRATION_DEADLINE;
  const submissionDeadline = process.env.SUBMISSION_DEADLINE;
  const registrationFee = process.env.REGISTRATION_FEE;

  if (registrationDeadline && submissionDeadline && registrationFee) {
    const registrationDate = new Date(registrationDeadline);
    const submissionDate = new Date(submissionDeadline);

    if (
      Number.isNaN(registrationDate.getTime()) ||
      Number.isNaN(submissionDate.getTime()) ||
      registrationDate > submissionDate
    ) {
      throw new Error("Invalid event deadlines: registration must be <= submission deadline");
    }

    await db
      .insert(eventConfig)
      .values({
        id: 1,
        registrationDeadline: registrationDate,
        submissionDeadline: submissionDate,
        registrationFee,
      })
      .onConflictDoNothing({ target: eventConfig.id });
  }

  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME;
  if (adminEmail && adminName) {
    await db
      .insert(admins)
      .values({
        email: adminEmail,
        name: adminName,
        role: "super_admin",
      })
      .onConflictDoNothing({ target: admins.email });
  }

  console.log("IdeaSpark database seed completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
