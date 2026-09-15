import "dotenv/config";
import { db, pool } from "../src/db";
import { admins, departments, eventConfig, tracks } from "../src/db/schema";

const departmentRows = [
  ["AERO", "Aeronautical"], ["ASE", "Aerospace"], ["AUTO", "Automobile"],
  ["BME", "Biomedical"], ["BT", "Biotechnology"], ["CA", "Computer Applications"],
  ["CHE", "Chemical"], ["CHEM", "Chemistry"], ["CINTEL", "Computational Intelligence"],
  ["CIVIL", "Civil"], ["COM", "Commerce"], ["CTECH", "Computing Technologies"],
  ["DSBS", "Data Science & Business Systems"], ["ECE", "Electronics and Communication"],
  ["ECM", "Electronics and Computer"], ["EEE", "Electrical and Electronics"],
  ["EIE", "Electronics and Instrumentation"], ["AF", "Accounting & Finance"],
  ["BBA", "Business Administration"], ["FT", "Food Technology"], ["GE", "Genetic"],
  ["HORT", "Horticulture"], ["INTD", "Interior Design"], ["MCT", "Mechatronics"],
  ["MECH", "Mechanical"], ["NWC", "Networking & Communications"],
  ["PNT", "Physics & Nanotechnology"], ["AGRI", "Agriculture"], ["ARCH", "Architecture"],
  ["OTHER", "Others"], ["CSE", "Computer Science and Engineering"],
  ["IT", "Information Technology"], ["AI_DS", "Artificial Intelligence & Data Science"],
] as const;

const trackRows = (process.env.IDEASPARK_TRACKS ?? "")
  .split(",").map((x) => x.trim()).filter(Boolean);

await db.transaction(async (tx) => {
  await tx.insert(departments)
    .values(departmentRows.map(([code, label]) => ({ code, label })))
    .onConflictDoNothing();

  if (trackRows.length) {
    await tx.insert(tracks)
      .values(trackRows.map((name) => ({ name, isActive: true })))
      .onConflictDoNothing();
  }

  const registrationDeadline = process.env.REGISTRATION_DEADLINE;
  const submissionDeadline = process.env.SUBMISSION_DEADLINE;
  const fee = process.env.REGISTRATION_FEE;
  if (registrationDeadline && submissionDeadline && fee) {
    await tx.insert(eventConfig).values({
      id: 1,
      registrationDeadline: new Date(registrationDeadline),
      submissionDeadline: new Date(submissionDeadline),
      registrationFee: fee,
      resultsPublished: false,
    }).onConflictDoUpdate({
      target: eventConfig.id,
      set: {
        registrationDeadline: new Date(registrationDeadline),
        submissionDeadline: new Date(submissionDeadline),
        registrationFee: fee,
        updatedAt: new Date(),
      },
    });
  }

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  const role = process.env.BOOTSTRAP_ADMIN_ROLE as
    | "super_admin" | "evaluator" | "volunteer" | undefined;

  if (email && name && role) {
    await tx.insert(admins).values({ email, name, role }).onConflictDoUpdate({
      target: admins.email,
      set: { name, role },
    });
  }
});

console.log("IdeaSpark database seed completed");
await pool.end();
