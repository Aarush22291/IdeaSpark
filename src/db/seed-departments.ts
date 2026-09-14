// Run: bunx tsx src/db/seed-departments.ts (needs DATABASE_URL)
import "dotenv/config";
import { db } from "../lib";
import { departments } from "./schema";

const rows = [
  ["AERO", "Aeronautical"],
  ["ASE", "Aerospace"],
  ["AUTO", "Automobile"],
  ["BME", "Biomedical"],
  ["BT", "Biotechnology"],
  ["CA", "Computer Applications"],
  ["CHE", "Chemical"],
  ["CHEM", "Chemistry"],
  ["CINTEL", "Computational Intelligence"],
  ["CIVIL", "Civil"],
  ["COM", "Commerce"],
  ["CTECH", "Computing Technologies"],
  ["DSBS", "Data Science & Business Systems"],
  ["ECE", "Electronics and Communication"],
  ["ECM", "Electronics and Computer"],
  ["EEE", "Electrical and Electronics"],
  ["EIE", "Electronics and Instrumentation"],
  ["AF", "Accounting & Finance"],
  ["BBA", "Business Administration"],
  ["FT", "Food Technology"],
  ["GE", "Genetic"],
  ["HORT", "Horticulture"],
  ["INTD", "Interior Design"],
  ["MCT", "Mechatronics"],
  ["MECH", "Mechanical"],
  ["NWC", "Networking & Communications"],
  ["PNT", "Physics & Nanotechnology"],
  ["AGRI", "Agriculture"],
  ["ARCH", "Architecture"],
  ["OTHER", "Others"],
] as const;

await db
  .insert(departments)
  .values(rows.map(([code, label]) => ({ code, label })))
  .onConflictDoNothing();
console.log(`Seeded ${rows.length} departments`);
process.exit(0);
