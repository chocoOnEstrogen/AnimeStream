import {
	ChannelType,
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js'
import { Command } from '../../../types/bot'
import { handleUpdates } from '../../utils/manager'

export default {
	data: new SlashCommandBuilder()
		.setName('manage')
		.setDescription('Manage the bot')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('updates')
				.setDescription('Manage the updates channel')
				.addChannelOption((option) =>
					option
						.setName('channel')
						.setDescription('The channel to send updates to')
						.addChannelTypes(
							ChannelType.GuildText,
							ChannelType.GuildAnnouncement,
						)
						.setRequired(false),
				),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand()

		switch (subcommand) {
			case 'updates':
				await handleUpdates(interaction)
				break
			default:
				await interaction.reply({
					content: 'Invalid subcommand',
					ephemeral: true,
				})
		}
	},
} as Command
