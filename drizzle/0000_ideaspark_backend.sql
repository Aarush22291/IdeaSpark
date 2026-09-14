CREATE TYPE department_enum AS ENUM (
  'CSE',
  'ECE',
  'EEE',
  'MECH',
  'CIVIL',
  'IT',
  'AI_DS',
  'BIOTECH',
  'OTHER'
);

CREATE TYPE submission_status_enum AS ENUM (
  'pending_submission',
  'in_review',
  'rejected',
  'accepted'
);

CREATE TYPE payment_status_enum AS ENUM (
  'unpaid',
  'paid'
);

CREATE TYPE payment_txn_status_enum AS ENUM (
  'created',
  'paid',
  'failed'
);

CREATE TYPE admin_role_enum AS ENUM (
  'super_admin',
  'evaluator',
  'volunteer'
);

CREATE TABLE tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tracks_name_unique UNIQUE (name)
);

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  track_id uuid REFERENCES tracks(id),
  payment_status payment_status_enum,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teams_team_name_unique UNIQUE (team_name)
);

CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  role admin_role_enum NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admins_email_unique UNIQUE (email)
);

CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  ra_number text NOT NULL,
  net_id text NOT NULL,
  phone_number text NOT NULL,
  department department_enum NOT NULL,
  faculty_name text NOT NULL,
  faculty_phone text NOT NULL,
  faculty_email text NOT NULL,
  is_leader boolean NOT NULL DEFAULT false,
  email text UNIQUE,
  google_id text UNIQUE,
  attendance_code text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT members_ra_number_unique UNIQUE (ra_number),
  CONSTRAINT members_net_id_unique UNIQUE (net_id)
);

CREATE UNIQUE INDEX one_leader_per_team
  ON members(team_id)
  WHERE is_leader = true;

CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  drive_link text,
  status submission_status_enum NOT NULL DEFAULT 'pending_submission',
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT submissions_team_id_unique UNIQUE (team_id)
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  razorpay_order_id text NOT NULL,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric(10,2) NOT NULL,
  status payment_txn_status_enum NOT NULL DEFAULT 'created',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  CONSTRAINT payments_team_id_unique UNIQUE (team_id),
  CONSTRAINT payments_razorpay_order_id_unique UNIQUE (razorpay_order_id),
  CONSTRAINT payments_razorpay_payment_id_unique UNIQUE (razorpay_payment_id)
);

CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  scanned_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  CONSTRAINT attendance_member_date_unique UNIQUE (member_id, event_date)
);

CREATE TABLE evaluation_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sequence_no integer NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX evaluation_rounds_one_active_idx
  ON evaluation_rounds(is_active)
  WHERE is_active = true;

CREATE TABLE scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round_id uuid NOT NULL REFERENCES evaluation_rounds(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  score numeric(5,2) NOT NULL,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scores_team_round_evaluator_unique UNIQUE (team_id, round_id, evaluator_id)
);

CREATE TABLE event_config (
  id integer PRIMARY KEY DEFAULT 1,
  registration_deadline timestamptz NOT NULL,
  submission_deadline timestamptz NOT NULL,
  registration_fee numeric(10,2) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_config_singleton CHECK (id = 1),
  CONSTRAINT event_config_deadlines_valid CHECK (registration_deadline <= submission_deadline)
);

CREATE INDEX teams_track_id_idx ON teams(track_id);
CREATE INDEX members_team_id_idx ON members(team_id);
CREATE INDEX submissions_status_idx ON submissions(status);
CREATE INDEX submissions_reviewed_by_idx ON submissions(reviewed_by);
CREATE INDEX payments_status_idx ON payments(status);
CREATE INDEX attendance_event_date_idx ON attendance(event_date);
CREATE INDEX attendance_scanned_by_idx ON attendance(scanned_by);
CREATE INDEX evaluation_rounds_active_idx ON evaluation_rounds(is_active);
CREATE INDEX scores_team_id_idx ON scores(team_id);
CREATE INDEX scores_round_id_idx ON scores(round_id);
CREATE INDEX scores_evaluator_id_idx ON scores(evaluator_id);
