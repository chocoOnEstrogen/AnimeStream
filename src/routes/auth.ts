import express from 'express'
import axios from 'axios'
import { storage } from '../utils/storage'
import { config } from '../config'

const router = express.Router()

// Create axios instance with base URL
const discord = axios.create({
	baseURL: 'https://discord.com/api/v10',
	validateStatus: (status) => status < 500, // Don't throw on 4xx errors
})

router.get('/login', (req, res) => {
	const url = new URL(`${discord.defaults.baseURL}/oauth2/authorize`)
	url.searchParams.set('client_id', config.discord.clientId)
	url.searchParams.set('response_type', 'code')
	url.searchParams.set('redirect_uri', `${config.baseUrl}/auth/callback`)
	url.searchParams.set('scope', 'identify email')

	res.redirect(url.toString())
})

router.get('/callback', async (req, res) => {
	const { code } = req.query

	if (!code) {
		return res.redirect('/auth/login')
	}

	try {
		// Exchange code for token
		const tokenRes = await discord.post(
			'/oauth2/token',
			new URLSearchParams({
				client_id: config.discord.clientId,
				client_secret: config.discord.clientSecret,
				grant_type: 'authorization_code',
				code: code.toString(),
				redirect_uri: `${config.baseUrl}/auth/callback`,
			}),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			},
		)

		const tokens = tokenRes.data

		// Get user info
		const userRes = await discord.get('/users/@me', {
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
			},
		})

		const discordUser = userRes.data

		// Save user to storage
		const user = {
			id: discordUser.id,
			username: discordUser.username,
			discriminator: discordUser.discriminator,
			avatar: discordUser.avatar,
			email: discordUser.email,
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			roles: ['user'],
			createdAt: Date.now(),
			lastLogin: Date.now(),
		}

		await storage.saveUser(user)

		// Set session
		;(req as any).session.userId = user.id

		res.redirect('/')
	} catch (error) {
		console.error(
			'Auth error:',
			(error as any).response?.data || (error as any).message,
		)
		res.redirect('/auth/login')
	}
})

router.get('/logout', (req, res) => {
	req.session.destroy(() => {
		res.redirect('/')
	})
})

export default router
