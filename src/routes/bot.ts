import express from 'express'
import { render } from '../utils/request'
import bot from '../bot'
import { getBotStatus } from '../utils/discord'

const router = express.Router()

router.get('/', async (req, res) => {
    try {
        const botStatus = await getBotStatus()
        const guilds = Array.from(bot.guilds.cache.values()).map(guild => ({
            id: guild.id,
            name: guild.name,
            memberCount: guild.memberCount,
            icon: guild.iconURL({ size: 64 }),
            joinedAt: guild.joinedAt
        }))

        render(req, res, 'bot', {
            title: 'Discord Bot',
            botStatus,
            guilds,
            bot
        })
    } catch (error) {
        console.error('Bot page error:', error)
        render(req, res, 'error', {
            title: 'Error',
            error: 'Failed to load bot information'
        })
    }
})

export default router 