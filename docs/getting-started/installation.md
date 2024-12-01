---
title: Installation Guide
description: How to set up AnimeStream on your server
dateAdded: 2024-12-01T21:50:34.061Z
lastUpdated: 2024-12-01T21:50:34.061Z
author: "1248626823638552701"
tags: ["setup", "installation"]
icon: "git"
order: 1
---

# Installation Guide

## Prerequisites

Before installing AnimeStream, ensure you have:

- Node.js 18 or higher
- npm or yarn
- A Discord application for authentication
- A Supabase account and project
- Sufficient storage for your media files

## Environment Setup

1. Clone the repository: 

```bash
git clone https://github.com/chocoOnEstrogen/AnimeStream.git
cd AnimeStream
```

2. Create a `.env` file in the root directory:

```env
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
SESSION_SECRET=your_session_secret
BASE_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DISCORD_BOT_TOKEN=your_discord_bot_token
```

3. Install dependencies:

```bash
npm install
```

4. Build the application:

```bash
npm run build
```

5. Start the server:

```bash
npm start
```


:::callout{type="tip"}
For development, you can use `npm run dev` to start the server with hot-reloading enabled.
:::

## Media Directory Structure

AnimeStream expects your media to be organized in a specific structure:

```
/path/to/media/
├── anime-title-1/
│   ├── info.ini
│   ├── cover.jpg
│   └── episodes/
│       ├── 01.mp4
│       └── 02.mp4
```


:::callout{type="note"}
The `info.ini` file contains metadata about the anime, including title, description, and MAL ID.
:::

## Info.ini File

```ini
[General]
Title=Anime_Title
Type=TV
Genre=Some, Genres
Description=Anime_Description
Mal_ID=123456
Date_Added=2024-12-01
```

:::callout{type="note"}
Types: `TV`, `Movie`, `OVA`, `Special`, `ONA`
:::