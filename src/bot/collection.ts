import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { Client, Collection } from 'discord.js'
import { Bot, Command, Event } from '../types/bot'

const isProd = process.env.NODE_ENV === 'production'

export const commands = new Collection<string, Command>()
export const events = new Collection<string, Event>()

export function loadCommands(path: string) {
	try {
		const files = readdirSync(path)

		for (const file of files) {
			const filePath = join(path, file)
			const stat = statSync(filePath)

			if (stat.isDirectory()) {
				loadCommands(filePath)
				continue
			}

			const fileExtension = isProd ? '.js' : '.ts'
			if (!file.endsWith(fileExtension)) {
				continue
			}

			try {
				const command = require(filePath)

				if (!command.default?.data?.name) {
					console.warn(`Command ${file} is missing required properties`)
					continue
				}

				commands.set(command.default.data.name, command.default)
			} catch (error: any) {
				console.error(`Failed to load command: ${file}: ${error.message}`)
			}
		}
	} catch (error: any) {
		console.error(`Failed to read directory ${path}: ${error.message}`)
	}
}

export function loadEvents(path: string, client: Bot<Client>) {
	try {
		const files = readdirSync(path)

		for (const file of files) {
			const filePath = join(path, file)
			const fileExtension = isProd ? '.js' : '.ts'

			if (!file.endsWith(fileExtension)) {
				continue
			}

			try {
				const event = require(filePath)

				if (!event.default?.name || !event.default?.execute) {
					console.warn(`Event ${file} is missing required properties`)
					continue
				}

				const execute = (...args: any[]) =>
					event.default.execute(client, ...args)

				if (event.default.once) {
					client.once(event.default.name, execute)
				} else {
					client.on(event.default.name, execute)
				}

				events.set(event.default.name, event.default)
			} catch (error: any) {
				console.error(`Failed to load event: ${file}: ${error.message}`)
			}
		}
	} catch (error: any) {
		console.error(`Failed to read directory ${path}: ${error.message}`)
	}
}

export function getCommands() {
	return commands
}

export function getEvents() {
	return events
}
