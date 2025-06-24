-- Shows table now only contains show information, not specific dates
CREATE TABLE IF NOT EXISTS shows (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Show dates table contains the specific dates and times for each show
-- Times are stored as TIMESTAMPTZ to include both date and time in Adelaide timezone
CREATE TABLE IF NOT EXISTS show_dates (
  id SERIAL PRIMARY KEY,
  show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  UNIQUE(show_id, start_time)
);

CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shifts now reference show_dates instead of shows directly
-- Also renamed start_time/end_time to arrive_time/depart_time for clarity
-- Added assigned_participant_id for direct assignment
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  show_date_id INTEGER REFERENCES show_dates(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  arrive_time TIMESTAMPTZ NOT NULL,
  depart_time TIMESTAMPTZ NOT NULL,
  assigned_participant_id INTEGER REFERENCES participants(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS participant_shifts (
  participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
  shift_id INTEGER REFERENCES shifts(id) ON DELETE CASCADE,
  PRIMARY KEY (participant_id, shift_id)
);

-- Better Auth tables
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "isAdmin" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider_id)
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
