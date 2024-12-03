---
title: Configuration Guide
description: Detailed configuration options for AnimeStream
dateAdded: 2024-12-01T21:50:34.061Z
lastUpdated: 2024-12-01T21:50:34.061Z
author: "1248626823638552701"
tags: ["configuration", "setup"]
icon: "gear"
order: 2
---

# Configuration Guide

## Environment Variables

All configuration is done through environment variables. Copy `.env.sample` to `.env` and configure:

### Required Variables

```env
# Discord OAuth2 Configuration
DISCORD_CLIENT_ID=       # Your Discord application client ID
DISCORD_CLIENT_SECRET=   # Your Discord application client secret
DISCORD_BOT_TOKEN=       # Your Discord bot token

# Session Configuration
SESSION_SECRET=          # Random string for session encryption
BASE_URL=               # Your application's base URL

# Database Configuration
SUPABASE_URL=           # Your Supabase project URL
SUPABASE_ANON_KEY=      # Your Supabase anonymous key

# Media Configuration
MEDIA_PATHS=            # Paths to your media directories (comma separated)
```

### Optional Variables

```env
# Server Configuration
PORT=3000               # Server port (default: 3000)
NODE_ENV=development    # Environment (development/production)
```

## Discord Setup

1. Create a Discord application at https://discord.com/developers
2. Enable OAuth2
3. Add redirect URL: `{BASE_URL}/auth/discord/callback`
4. Create a bot user
5. Enable required intents:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent

## Media Configuration

### Directory Structure

```
media/
├── anime/
│   ├── series-1/
│   │   ├── info.ini
│   │   ├── cover.jpg
│   │   └── episodes/
│   │       ├── 01.mp4
│   │       └── 02.mp4
│   └── series-2/
```

### Info.ini Format

```ini
[General]
Title=Anime_Title
Type=TV
Genre=Some, Genres
Description=Anime_Description
Mal_ID=123456
Date_Added=2024-12-01
```