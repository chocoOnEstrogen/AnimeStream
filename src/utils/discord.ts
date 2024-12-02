import bot from "../bot";
import NodeCache from "node-cache";

// 5 minutes
export const cache = new NodeCache({ stdTTL: 60 * 5 });

export interface BotStatus {
	online: boolean;
	guildCount: number;
	ping: number;
	uptime: number | null;
}

export const getBotStatus = (): Promise<BotStatus> => {
	return new Promise((resolve) => {
		const cached = cache.get('botStatus') as BotStatus | undefined
		if (cached && cached.online) return resolve(cached)
		
		const statusInfo: BotStatus = {
			online: bot.isReady(),
			guildCount: bot.guilds.cache.size,
			ping: bot.ws.ping,
			uptime: bot.uptime
		}

		// Only cache if the bot is actually online
		if (statusInfo.online) {
			cache.set('botStatus', statusInfo)
		}

		resolve(statusInfo)
	})
}