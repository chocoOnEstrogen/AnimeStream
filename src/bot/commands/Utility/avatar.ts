import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js'
import { Command } from '../../../types/bot'

export default {
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription("Get user's avatar")
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('The user to get avatar from')
				.setRequired(false),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser('user') ?? interaction.user

		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle(`${user.username}'s Avatar`)
			.setImage(user.displayAvatarURL({ size: 1024 }))
			.setTimestamp()

		await interaction.reply({ embeds: [embed] })
	},
} as Command
