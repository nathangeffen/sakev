PRAGMA journal_mode = wal;

CREATE TABLE IF NOT EXISTS users (
  username TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  session TEXT UNIQUE NOT NULL,
  user_id INTEGER DEFAULT 0 NOT NULL,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY(session, user_id)
);

CREATE TABLE IF NOT EXISTS game (
  south STRING NOT NULL,
  north STRING NOT NULL,
  start_position_id INTEGER NOT NULL,
  south_start_seconds INTEGER DEFAULT 300,
  north_start_seconds INTEGER DEFAULT 300,
  south_increment_seconds INTEGER DEFAULT 2,
  north_increment_seconds INTEGER DEFAULT 2,
  result INTEGER,
  result_reason INTEGER,
  event_id INTEGER,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS move (
  game_id INTEGER NOT NULL,
  ply TEXT,
  side INTEGER,
  move TEXT,
  milliseconds_taken INTEGER,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY(game_id, ply)
);

CREATE TABLE IF NOT EXISTS event (
  name TEXT,
  description TEXT,
  date_start TEXT,
  date_end TEXT,
  url TEXT,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS position (
  user_id INT DEFAULT 0,
  name TEXT DEFAULT "anonymous",
  specification TEXT NOT NULL,
  public boolean DEFAULT true,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, specification) ON CONFLICT ABORT
);

CREATE TABLE IF NOT EXISTS gamesearch (
  session TEXT PRIMARY KEY,
  position_id INTEGER DEFAULT 0,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial data

INSERT INTO position (name, specification) VALUES(
  'DEFAULT',
  '1#9x9#rrbbrbbrr_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_RRBBRBBRR#010102020302020101000000000000000000000000000000000000000000000300000000000000000000000000000000003000000000000000000000000000000000000000000000101020203020201010#x_x_x_x_x_x_x_x_x_xbx_x_xbx_x_x_x_x_x_x_b_x_x_x_x_x_x_xbx_x_xbx_x_x_x_x_x_x_x_x_x#s#0-1#8-8#0#t#0-32#f')