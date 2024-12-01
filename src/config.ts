import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config()

// Validate required environment variables
const requiredEnvVars = [
	'DISCORD_CLIENT_ID',
	'DISCORD_CLIENT_SECRET',
	'SESSION_SECRET',
	'BASE_URL',
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
	},

	session: {
		secret: process.env.SESSION_SECRET!,
	},

	media: ['/home/neko/Anime'],
}
