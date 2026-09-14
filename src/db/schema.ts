import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const departmentEnum = pgEnum("department_enum", [
  "CSE",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "IT",
  "AI_DS",
  "BIOTECH",
  "OTHER",
]);

export const submissionStatusEnum = pgEnum("submission_status_enum", [
  "pending_submission",
  "in_review",
  "rejected",
  "accepted",
]);

export const paymentStatusEnum = pgEnum("payment_status_enum", [
  "unpaid",
  "paid",
]);

export const paymentTxnStatusEnum = pgEnum("payment_txn_status_enum", [
  "created",
  "paid",
  "failed",
]);

export const adminRoleEnum = pgEnum("admin_role_enum", [
  "super_admin",
  "evaluator",
  "volunteer",
]);

export const tracks = pgTable(
  "tracks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("tracks_name_unique").on(table.name)],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamName: text("team_name").notNull(),
    trackId: uuid("track_id").references(() => tracks.id),
    paymentStatus: paymentStatusEnum("payment_status"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("teams_team_name_unique").on(table.teamName),
    index("teams_track_id_idx").on(table.trackId),
  ],
);

export const admins = pgTable(
  "admins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: adminRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("admins_email_unique").on(table.email)],
);

export const members = pgTable(
  "members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    raNumber: text("ra_number").notNull(),
    netId: text("net_id").notNull(),
    phoneNumber: text("phone_number").notNull(),
    department: departmentEnum("department").notNull(),
    facultyName: text("faculty_name").notNull(),
    facultyPhone: text("faculty_phone").notNull(),
    facultyEmail: text("faculty_email").notNull(),
    isLeader: boolean("is_leader").notNull().default(false),
    email: text("email"),
    googleId: text("google_id"),
    attendanceCode: text("attendance_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("members_ra_number_unique").on(table.raNumber),
    uniqueIndex("members_net_id_unique").on(table.netId),
    uniqueIndex("members_email_unique").on(table.email),
    uniqueIndex("members_google_id_unique").on(table.googleId),
    uniqueIndex("members_attendance_code_unique").on(table.attendanceCode),
    uniqueIndex("one_leader_per_team")
      .on(table.teamId)
      .where(sql`${table.isLeader} = true`),
    index("members_team_id_idx").on(table.teamId),
  ],
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    driveLink: text("drive_link"),
    status: submissionStatusEnum("status").notNull().default("pending_submission"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => admins.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    remarks: text("remarks"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("submissions_team_id_unique").on(table.teamId),
    index("submissions_status_idx").on(table.status),
    index("submissions_reviewed_by_idx").on(table.reviewedBy),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    razorpayOrderId: text("razorpay_order_id").notNull(),
    razorpayPaymentId: text("razorpay_payment_id"),
    razorpaySignature: text("razorpay_signature"),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: paymentTxnStatusEnum("status").notNull().default("created"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("payments_team_id_unique").on(table.teamId),
    uniqueIndex("payments_razorpay_order_id_unique").on(table.razorpayOrderId),
    uniqueIndex("payments_razorpay_payment_id_unique").on(table.razorpayPaymentId),
    index("payments_status_idx").on(table.status),
  ],
);

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    eventDate: date("event_date").notNull(),
    scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(),
    scannedBy: uuid("scanned_by").references(() => admins.id, { onDelete: "set null" }),
  },
  (table) => [
    unique("attendance_member_date_unique").on(table.memberId, table.eventDate),
    index("attendance_event_date_idx").on(table.eventDate),
    index("attendance_scanned_by_idx").on(table.scannedBy),
  ],
);

export const evaluationRounds = pgTable(
  "evaluation_rounds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    sequenceNo: integer("sequence_no").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("evaluation_rounds_one_active_idx")
      .on(table.isActive)
      .where(sql`${table.isActive} = true`),
    index("evaluation_rounds_active_idx").on(table.isActive),
  ],
);

export const scores = pgTable(
  "scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    roundId: uuid("round_id")
      .notNull()
      .references(() => evaluationRounds.id, { onDelete: "cascade" }),
    evaluatorId: uuid("evaluator_id")
      .notNull()
      .references(() => admins.id, { onDelete: "restrict" }),
    score: numeric("score", { precision: 5, scale: 2 }).notNull(),
    remarks: text("remarks"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("scores_team_round_evaluator_unique").on(
      table.teamId,
      table.roundId,
      table.evaluatorId,
    ),
    index("scores_team_id_idx").on(table.teamId),
    index("scores_round_id_idx").on(table.roundId),
    index("scores_evaluator_id_idx").on(table.evaluatorId),
  ],
);

export const eventConfig = pgTable("event_config", {
  id: integer("id").primaryKey().default(1),
  registrationDeadline: timestamp("registration_deadline", { withTimezone: true }).notNull(),
  submissionDeadline: timestamp("submission_deadline", { withTimezone: true }).notNull(),
  registrationFee: numeric("registration_fee", { precision: 10, scale: 2 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("event_config_singleton", sql`${table.id} = 1`),
  check("event_config_deadlines_valid", sql`${table.registrationDeadline} <= ${table.submissionDeadline}`),
]);
