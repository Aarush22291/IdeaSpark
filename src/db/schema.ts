import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

// User ids (leadUserId, judgeUserId, reviewedBy, actorUserId) are Neon
// Better Auth `user.id` values (text) taken from auth.api.getSession().

export const tracks = pgTable("tracks", {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  description: text(),
});

export const teams = pgTable("teams", {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  trackId: integer().references(() => tracks.id, { onDelete: "set null" }),
  leadUserId: text().notNull(),
  status: varchar({ length: 32 }).notNull().default("pending"),
  reviewedBy: text(),
  reviewedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const teamMembers = pgTable(
  "team_members",
  {
    id: serial().primaryKey(),
    teamId: integer()
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    raNumber: varchar({ length: 32 }).notNull(),
    phone: varchar({ length: 20 }).notNull(),
    netId: varchar({ length: 64 }).notNull(),
    department: varchar({ length: 128 }).notNull(),
    faName: varchar({ length: 255 }).notNull(),
    faMobile: varchar({ length: 20 }).notNull(),
    faEmail: varchar({ length: 255 }).notNull(),
    isPresentDay1: integer().notNull().default(0),
    isPresentDay2: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.teamId, t.raNumber)],
);

export const ideas = pgTable(
  "ideas",
  {
    id: serial().primaryKey(),
    teamId: integer()
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    title: varchar({ length: 255 }).notNull(),
    description: text().notNull(),
    pptLink: text().notNull(),
    round: integer().notNull().default(1),
    status: varchar({ length: 32 }).notNull().default("submitted"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.teamId, t.round)],
);

export const payments = pgTable("payments", {
  id: serial().primaryKey(),
  teamId: integer()
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  amount: integer().notNull(),
  txnRef: varchar({ length: 255 }).notNull(),
  screenshotUrl: text(),
  status: varchar({ length: 32 }).notNull().default("pending"),
  reviewedBy: text(),
  reviewedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: serial().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  body: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const scores = pgTable(
  "scores",
  {
    id: serial().primaryKey(),
    ideaId: integer()
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    judgeUserId: text().notNull(),
    innovation: integer().notNull(),
    feasibility: integer().notNull(),
    impact: integer().notNull(),
    presentation: integer().notNull(),
    remarks: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.ideaId, t.judgeUserId)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial().primaryKey(),
    actorUserId: text(),
    action: varchar({ length: 64 }).notNull(),
    targetType: varchar({ length: 32 }).notNull(),
    targetId: integer().notNull(),
    meta: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_target_idx").on(t.targetType, t.targetId)],
);
