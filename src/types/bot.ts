import {
	AutocompleteInteraction,
	ChatInputApplicationCommandData,
	ChatInputCommandInteraction,
	Client,
	Collection,
	Events,
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
} from 'discord.js'

export type Bot<T extends Client> = T & {
	commands: Collection<string, Command>
}

export type Command = {
	data: SlashCommandBuilder | SlashCommandSubcommandBuilder
	execute: (interaction: ChatInputCommandInteraction) => any | Promise<any>
	autocomplete?: (interaction: AutocompleteInteraction) => any | Promise<any>
}

export type Event = {
	name: Events
	description?: string
	once?: boolean
	execute: (...args: any[]) => any | Promise<any>
}
