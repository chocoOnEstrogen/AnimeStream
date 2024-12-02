import { Collection, Client, GatewayIntentBits } from 'discord.js'
import { Bot } from '../types/bot'
import { config as dotenv } from 'dotenv'
import { loadCommands, loadEvents, commands, events } from './collection'
import { join } from 'node:path'

dotenv()
const token = process.env.DISCORD_BOT_TOKEN

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildVoiceStates,
	],
	allowedMentions: {
		parse: ['everyone', 'roles', 'users'],
		repliedUser: true,
	},
}) as Bot<Client>

client.commands = new Collection()

loadCommands(join(__dirname, 'commands'))

client.commands = commands

loadEvents(join(__dirname, 'events'), client)

export function startBot() {
	client.login(token)
}

export default client