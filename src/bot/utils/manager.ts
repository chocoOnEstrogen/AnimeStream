import { ChatInputCommandInteraction, Client, EmbedBuilder } from 'discord.js'
import { supabase } from '../../utils/supabase'
import { Bot } from 'src/types/bot'
import client from '../index'

async function getGuild(guildId: string) {
	if (!guildId) throw new Error('Guild ID is required')

	const { data, error } = await supabase
		.from('guilds')
		.select('*')
		.eq('id', guildId)
		.single()

	if (!error) return data

	// If the guild is not in the database, add it
	const { data: newGuild, error: newError } = await supabase
		.from('guilds')
		.insert({ id: guildId })
		.select()
		.single()

	if (newError) throw newError
	return newGuild
}

export async function handleUpdates(interaction: ChatInputCommandInteraction) {
	try {
		if (!interaction.guildId) {
			throw new Error('This command can only be used in a server')
		}

		const guild = await getGuild(interaction.guildId)
		const channel = interaction.options.getChannel('channel')

		// If no channel is provided, show current updates channel
		if (!channel) {
			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle('Updates Channel')
				.setDescription(
					guild.updates_channel_id
						? `Current updates channel: <#${guild.updates_channel_id}>`
						: 'No updates channel set'
				)
				.setTimestamp()

			await interaction.reply({ embeds: [embed], ephemeral: true })
			return
		}

		await supabase
			.from('guilds')
			.update({ updates_channel_id: channel.id })
			.eq('id', guild.id)

		const embed = new EmbedBuilder()
			.setColor('#00ff00')
			.setTitle('Updates Channel Updated')
			.setDescription(`Updates channel set to ${channel}`)
			.setTimestamp()

		await interaction.reply({ embeds: [embed], ephemeral: true })
	} catch (error) {
		console.error('Error in handleUpdates:', error)
		
		const embed = new EmbedBuilder()
			.setColor('#ff0000')
			.setTitle('Error')
			.setDescription(error instanceof Error ? error.message : 'Failed to update updates channel')
			.setTimestamp()

		await interaction.reply({ embeds: [embed], ephemeral: true })
	}
}

export async function sendBlogNotification(post: any) {
	try {
		// Fetch all guilds with update channels
		const { data: guilds, error } = await supabase
			.from('guilds')
			.select('*')
			.not('updates_channel_id', 'is', null)

		if (error) throw error

        const author = await supabase.from('users').select('*').eq('id', post.author_id).single()

        if (!author) throw new Error('Author not found')

        const authorData = await client.users.fetch(post.author_id)

        if (!authorData) throw new Error('Author data not found')

		// Create embed for the blog post
		const embed = new EmbedBuilder()
			.setTitle(`New Blog Post: ${post.title}`)
			.setAuthor({
				name: `${authorData.displayName !== authorData.username ? `${authorData.displayName} | ` : ''}${authorData.username}`,
				iconURL: authorData.avatarURL() || undefined,
				url: `${process.env.BASE_URL}/profile/${authorData.id}`,
			})
			.setDescription(post.excerpt || 'Click to read more!')
			.setURL(`${process.env.BASE_URL}/blog/${post.slug}`)
			.setFooter({
				text: `#${post.tags.join(', #')}`,
			})
			.setColor('#0099ff')
			.setTimestamp()

		if (post.cover_image) {
			embed.setImage(`${process.env.BASE_URL}/media/blog/${post.id}/cover`)
		}


		// Send to all guild update channels
		for (const guild of guilds) {
			try {
				const channel = await client.channels.fetch(guild.updates_channel_id)
				if (channel?.isTextBased() && channel.isSendable()) {
					await channel.send({ embeds: [embed] })
				}
			} catch (err) {
				console.error(`Failed to send blog update to guild ${guild.id}:`, err)
			}
		}
	} catch (error) {
		console.error('Failed to send blog notifications:', error)
	}
}
