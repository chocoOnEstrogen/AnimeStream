import { Client, Events, Guild, ChannelType, GuildBasedChannel } from 'discord.js'
import { Bot, Event } from '../../types/bot'
import { supabase } from '../../utils/supabase'
import { TextChannel, EmbedBuilder } from 'discord.js'

export default {
	name: Events.GuildCreate,
	once: false,
	async execute(client: Bot<Client>, guild: Guild) {
		const { error } = await supabase.from('guilds').insert({
			id: guild.id,
			created_at: new Date().toISOString(),
			updates_channel_id: null
		})

		if (error) {
			console.error('Failed to insert guild into database:', error)
		}

		let targetChannel = guild.systemChannel

		if (!targetChannel) {
			const channels = guild.channels.cache.filter(channel => 
				channel.type === ChannelType.GuildText && 
				channel instanceof TextChannel && 
				channel.viewable && 
				channel.permissionsFor(guild.roles.everyone)?.has('ViewChannel')
			) as Map<string, TextChannel>

			if (channels.size > 0) {
				const sortedChannels = Array.from(channels.values())
					.sort((a, b) => (a.position || 0) - (b.position || 0))

				targetChannel = sortedChannels.find(channel => 
					channel.name.includes('general') || 
					channel.name.includes('chat')
				) || sortedChannels[0]
			}
		}

		if (targetChannel) {
			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(`Thanks for adding ${client.user?.username}!`)
				.setThumbnail(client.user?.displayAvatarURL() || '')
				.setDescription(`Your gateway to ${client.user?.username} updates and notifications!`)
				.addFields(
					{
						name: '📢 Setup Updates Channel',
						value: 'Use `/manage updates` to set up a channel for blog posts and important announcements.',
						inline: false
					},
					{
						name: '🔗 Website',
						value: `[Visit ${client.user?.username}](${process.env.BASE_URL})`,
						inline: true
					},
					{
						name: '📚 Documentation',
						value: `[View Docs](${process.env.BASE_URL}/docs)`,
						inline: true
					}
				)
				.setFooter({
					text: `${client.user?.username} Bot`,
					iconURL: client.user?.displayAvatarURL() || ''
				})
				.setTimestamp()

			await targetChannel.send({ embeds: [embed] })
		}
	},
} as Event
