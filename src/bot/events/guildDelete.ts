import { Client, Events, Guild } from 'discord.js'
import { Bot, Event } from '../../types/bot'
import { supabase } from '../../utils/supabase'

export default {
	name: Events.GuildDelete,
	once: false,
	async execute(client: Bot<Client>, guild: Guild) {
		await supabase.from('guilds').delete().eq('id', guild.id)
	},
} as Event
