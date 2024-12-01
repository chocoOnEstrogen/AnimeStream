import { Client, Events, Interaction } from 'discord.js'
import { Bot, Event } from '../../types/bot'

export default {
	name: Events.InteractionCreate,
	once: false,
	async execute(client: Bot<Client>, interaction: Interaction) {

		if (interaction.isChatInputCommand()) {
			const command = client.commands.get(interaction.commandName)
			if (!command) {
				console.warn(`Command ${interaction.commandName} not found`)
				return
			}

			try {
				await command.execute(interaction)
			} catch (error: any) {
				console.error(
					`Error executing command ${interaction.commandName}: ${error.message}`,
				)
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({
						content: 'There was an error while executing this command!',
						ephemeral: true,
					})
				} else {
					await interaction.reply({
						content: 'There was an error while executing this command!',
						ephemeral: true,
					})
				}
			}
		} else if (interaction.isAutocomplete()) {
			const command = client.commands.get(interaction.commandName)

			if (!command) {
				console.error(
					`No command matching ${interaction.commandName} was found.`,
				)
				return
			}

			if (!command.autocomplete) return

			try {
				await command.autocomplete(interaction)
			} catch (error) {
				console.error(error)
			}
		}
	},
} as Event
