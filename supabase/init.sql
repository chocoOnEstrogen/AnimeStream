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

-- Blog table
CREATE TABLE blog (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  tags TEXT[],
  featured_image TEXT,
  cover_image TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE
);

-- Discord guilds table
CREATE TABLE guilds (
  id TEXT PRIMARY KEY,
  updates_channel_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System alerts table
CREATE TABLE system_alerts (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Security Advisories table
CREATE TABLE security_advisories (
    id TEXT PRIMARY KEY,
    cve_id TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    affected_versions TEXT[],
    fixed_versions TEXT[],
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    author_id TEXT REFERENCES users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_users_roles ON users USING GIN (roles);
CREATE INDEX idx_watch_history_timestamp ON watch_history (timestamp DESC);
CREATE INDEX idx_suggestions_status ON suggestions (status);

-- Add indexes for the blog table
CREATE INDEX idx_blog_slug ON blog (slug);
CREATE INDEX idx_blog_status ON blog (status);
CREATE INDEX idx_blog_author ON blog (author_id);
CREATE INDEX idx_blog_published_at ON blog (published_at DESC);
CREATE INDEX idx_blog_tags ON blog USING GIN (tags);

-- Create index for the guilds table
CREATE INDEX idx_guilds_updates_channel_id ON guilds (updates_channel_id);

-- Create index for the system_alerts table
CREATE INDEX idx_system_alerts_type ON system_alerts (type);

-- Add indexes for the security_advisories table
CREATE INDEX idx_security_cve_id ON security_advisories (cve_id);
CREATE INDEX idx_security_status ON security_advisories (status);
CREATE INDEX idx_security_severity ON security_advisories (severity);
CREATE INDEX idx_security_published_at ON security_advisories (published_at DESC);