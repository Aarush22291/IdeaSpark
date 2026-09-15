import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  sql,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

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

// Kept separate from submission status because the newer branch has an
// explicit admin registration-review step in addition to idea review.
export const teamStatusEnum = pgEnum("team_status_enum", [
  "pending",
  "approved",
  "rejected",
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

export const tracks = pgTable("tracks", {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  description: text(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// The branch had a richer department catalogue than the PRD enum. Keep it as
// a table so the frontend can load the official department list dynamically.
export const departments = pgTable("departments", {
  code: varchar({ length: 16 }).primaryKey(),
  label: varchar({ length: 128 }).notNull().unique(),
});

export const admins = pgTable("admins", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  role: adminRoleEnum().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const teams = pgTable(
  "teams",
  {
    id: uuid().defaultRandom().primaryKey(),
    teamName: varchar({ length: 255 }).notNull().unique(),
    trackId: uuid().references(() => tracks.id, { onDelete: "set null" }),
    leadUserId: text().notNull().unique(),
    // Preserved from the newer branch as registration-level review state.
    status: teamStatusEnum().notNull().default("pending"),
    paymentStatus: paymentStatusEnum(),
    reviewedBy: uuid().references(() => admins.id, { onDelete: "set null" }),
    reviewedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("teams_name_not_blank", sql`length(trim(${t.teamName})) > 0`),
    index("teams_track_id_idx").on(t.trackId),
    index("teams_status_idx").on(t.status),
    index("teams_payment_status_idx").on(t.paymentStatus),
  ],
);

export const members = pgTable(
  "members",
  {
    id: uuid().defaultRandom().primaryKey(),
    teamId: uuid()
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    raNumber: varchar({ length: 64 }).notNull().unique(),
    netId: varchar({ length: 128 }).notNull().unique(),
    phoneNumber: varchar({ length: 20 }).notNull(),
    departmentCode: varchar({ length: 16 })
      .notNull()
      .references(() => departments.code),
    facultyName: varchar({ length: 255 }).notNull(),
    facultyPhone: varchar({ length: 20 }).notNull(),
    facultyEmail: varchar({ length: 255 }).notNull(),
    isLeader: boolean().notNull().default(false),
    email: varchar({ length: 255 }).unique(),
    googleId: varchar({ length: 255 }).unique(),
    attendanceCode: varchar({ length: 128 }).unique(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("members_team_id_idx").on(t.teamId),
    index("members_department_idx").on(t.departmentCode),
  ],
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid().defaultRandom().primaryKey(),
    teamId: uuid()
      .notNull()
      .unique()
      .references(() => teams.id, { onDelete: "cascade" }),
    title: varchar({ length: 255 }),
    description: text(),
    driveLink: text(),
    status: submissionStatusEnum().notNull().default("pending_submission"),
    submittedAt: timestamp({ withTimezone: true }),
    reviewedBy: uuid().references(() => admins.id, { onDelete: "set null" }),
    reviewedAt: timestamp({ withTimezone: true }),
    remarks: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("submissions_status_idx").on(t.status),
    index("submissions_reviewed_by_idx").on(t.reviewedBy),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid().defaultRandom().primaryKey(),
    teamId: uuid()
      .notNull()
      .unique()
      .references(() => teams.id, { onDelete: "cascade" }),
    razorpayOrderId: varchar({ length: 255 }).notNull().unique(),
    razorpayPaymentId: varchar({ length: 255 }).unique(),
    razorpaySignature: text(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    status: paymentTxnStatusEnum().notNull().default("created"),
    // Optional compatibility fields for the newer UI; canonical payment
    // confirmation remains Razorpay/webhook-driven per the PRD.
    txnRef: varchar({ length: 255 }),
    screenshotUrl: text(),
    reviewedBy: uuid().references(() => admins.id, { onDelete: "set null" }),
    reviewedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    check("payments_amount_nonnegative", sql`${t.amount} >= 0`),
    index("payments_status_idx").on(t.status),
    index("payments_razorpay_payment_id_idx").on(t.razorpayPaymentId),
  ],
);

export const attendance = pgTable(
  "attendance",
  {
    id: uuid().defaultRandom().primaryKey(),
    memberId: uuid()
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    eventDate: date().notNull(),
    scannedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    scannedBy: uuid().references(() => admins.id, { onDelete: "set null" }),
  },
  (t) => [
    unique("attendance_member_date_unique").on(t.memberId, t.eventDate),
    index("attendance_event_date_idx").on(t.eventDate),
    index("attendance_scanned_by_idx").on(t.scannedBy),
  ],
);

export const evaluationRounds = pgTable(
  "evaluation_rounds",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    sequenceNo: integer().notNull(),
    isActive: boolean().notNull().default(false),
    resultsPublished: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("evaluation_round_sequence_unique").on(t.sequenceNo),
    uniqueIndex("evaluation_rounds_one_active_unique").on(t.isActive).where(sql`${t.isActive} = true`),
  ],
);

export const scores = pgTable(
  "scores",
  {
    id: uuid().defaultRandom().primaryKey(),
    teamId: uuid()
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    roundId: uuid()
      .notNull()
      .references(() => evaluationRounds.id, { onDelete: "cascade" }),
    evaluatorId: uuid()
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    score: numeric({ precision: 5, scale: 2 }).notNull(),
    remarks: text(),
    // Optional rubric fields retained from the newer branch. `score` is the
    // canonical aggregate used by the PRD leaderboard query.
    innovation: numeric({ precision: 5, scale: 2 }),
    feasibility: numeric({ precision: 5, scale: 2 }),
    impact: numeric({ precision: 5, scale: 2 }),
    presentation: numeric({ precision: 5, scale: 2 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("scores_score_range", sql`${t.score} >= 0 AND ${t.score} <= 100`),
    unique("scores_team_round_evaluator_unique").on(
      t.teamId,
      t.roundId,
      t.evaluatorId,
    ),
    index("scores_team_id_idx").on(t.teamId),
    index("scores_round_id_idx").on(t.roundId),
    index("scores_evaluator_id_idx").on(t.evaluatorId),
  ],
);

export const eventConfig = pgTable("event_config", {
  id: integer().primaryKey().default(1),
  registrationDeadline: timestamp({ withTimezone: true }).notNull(),
  submissionDeadline: timestamp({ withTimezone: true }).notNull(),
  registrationFee: numeric({ precision: 10, scale: 2 }).notNull(),
  resultsPublished: boolean().notNull().default(false),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("event_config_singleton", sql`${t.id} = 1`),
  check("event_config_deadline_order", sql`${t.registrationDeadline} <= ${t.submissionDeadline}`),
  check("event_config_fee_nonnegative", sql`${t.registrationFee} >= 0`),
]);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid().defaultRandom().primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    body: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("announcements_created_at_idx").on(t.createdAt)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid().defaultRandom().primaryKey(),
    actorUserId: text(),
    action: varchar({ length: 64 }).notNull(),
    targetType: varchar({ length: 32 }).notNull(),
    targetId: text().notNull(),
    meta: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_log_target_idx").on(t.targetType, t.targetId),
    index("audit_log_actor_idx").on(t.actorUserId),
    index("audit_log_created_at_idx").on(t.createdAt),
  ],
);
