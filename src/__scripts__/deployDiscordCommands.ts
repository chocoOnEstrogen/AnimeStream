import { REST, Routes, SlashCommandBuilder } from 'discord.js'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { config } from 'dotenv'

interface EnvVars {
	DISCORD_BOT_TOKEN: string
	DISCORD_CLIENT_ID: string
}

export const deployCommands = async () => {
	config()
	const commands = []

	// Validate environment variables
	const requiredEnvVars: (keyof EnvVars)[] = [
		'DISCORD_BOT_TOKEN',
		'DISCORD_CLIENT_ID',
	]

	const missingVars = requiredEnvVars.filter((key) => !process.env[key])
	if (missingVars.length > 0) {
		console.error(
			`Missing environment variables: ${missingVars.join(', ')}`,
			'Commands',
		)
		process.exit(1)
	}

	const { DISCORD_BOT_TOKEN: token, DISCORD_CLIENT_ID: clientId } =
		process.env as unknown as EnvVars

	try {
		// Load commands
		const folderPath = join(__dirname, '..', 'bot', 'commands')
		const commandFolders = readdirSync(folderPath)

		for (const folder of commandFolders) {
			const commandFiles = readdirSync(join(folderPath, folder)).filter(
				(file) =>
					file.endsWith(process.env.NODE_ENV === 'production' ? '.js' : '.ts'),
			)

			for (const file of commandFiles) {
				const command = require(join(folderPath, folder, file)).default
				if (!command?.data?.name) {
					console.warn(
						`Command ${file} is missing required properties`,
						'Commands',
					)
					continue
				}
				commands.push(
					command.data instanceof SlashCommandBuilder ?
						command.data.toJSON()
					:	command.data,
				)
			}
		}

		// Deploy commands
		const rest = new REST({ version: '10' }).setToken(token)
		console.log(
			`Deploying ${commands.length} application (/) commands...`,
			'Commands',
		)

		await rest.put(Routes.applicationCommands(clientId), {
			body: commands,
		})

		console.log('Successfully deployed application (/) commands.', 'Commands')
	} catch (error) {
		console.error(`Failed to deploy commands: ${error}`)
		process.exit(1)
	}
}

// Self-executing function when run directly
if (require.main === module) {
	deployCommands().catch(console.error)
}
