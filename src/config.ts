import dotenv from 'dotenv'
import path from 'path'
import { parseMediaConfig } from './utils/mediaConfig'

// Load environment variables
dotenv.config()

// Validate required environment variables
const requiredEnvVars = [
	'DISCORD_CLIENT_ID',
	'DISCORD_CLIENT_SECRET',
	'SESSION_SECRET',
	'BASE_URL',
	'DISCORD_BOT_TOKEN',
	'SUPABASE_ANON_KEY',
	'SUPABASE_URL',
	'SUPABASE_SERVICE_ROLE',
]

for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		throw new Error(`Missing required environment variable: ${envVar}`)
	}
}

export const config = {
	port: process.env.PORT || 3000,
	baseUrl: process.env.BASE_URL || 'http://localhost:3000',

	discord: {
		clientId: process.env.DISCORD_CLIENT_ID!,
		clientSecret: process.env.DISCORD_CLIENT_SECRET!,
		invite: 'https://discord.gg/u8V7dthN',
	},

	session: {
		secret: process.env.SESSION_SECRET!,
	},

	media: parseMediaConfig(process.env.MEDIA_PATHS || ''),
	blogMedia: path.join(__dirname, '../data/blog'),

	github: {
		webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
	}
}
