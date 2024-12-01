-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  discriminator TEXT,
  avatar TEXT,
  email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  roles TEXT[] DEFAULT ARRAY['user'],
  bio TEXT,
  settings JSONB DEFAULT '{"theme": "dark", "autoplay": false, "notifications": true}'::jsonb,
  favorite_anime TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Suggestions table
CREATE TABLE suggestions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  mal_id INTEGER,
  priority TEXT,
  comment TEXT,
  image TEXT,
  synopsis TEXT,
  type TEXT,
  status TEXT DEFAULT 'pending',
  review_note TEXT,
  reviewed_by TEXT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Watch history table
CREATE TABLE watch_history (
  user_id TEXT REFERENCES users(id),
  anime_id TEXT NOT NULL,
  season TEXT NOT NULL,
  episode TEXT NOT NULL,
  progress FLOAT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, anime_id, season, episode)
);

-- Create indexes for better performance
CREATE INDEX idx_users_roles ON users USING GIN (roles);
CREATE INDEX idx_watch_history_timestamp ON watch_history (timestamp DESC);
CREATE INDEX idx_suggestions_status ON suggestions (status);