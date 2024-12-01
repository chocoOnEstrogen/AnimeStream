import { Client, Events } from 'discord.js'
import { Bot, Event } from '../../types/bot'

export default {
	name: Events.ClientReady,
	once: true,
	execute(client: Bot<Client>) {
		console.log(`Logged in as ${client.user?.tag}`)
	},
} as Event
