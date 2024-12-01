import axios from 'axios'
import { supabase } from './supabase'
import cron from 'node-cron'
import dotenv from 'dotenv'

dotenv.config()

async function updateUsers() {
	try {
		const { data: users, error } = await supabase.from('users').select('id')

		if (error) {
			console.error('Supabase error:', error)
			return
		}

		for (const user of users) {
			try {
				// Add delay to respect Discord rate limits (50 requests per second)
				await new Promise((resolve) => setTimeout(resolve, 50))

				const response = await axios.get(
					`https://discord.com/api/v10/users/${user.id}`,
					{
						headers: {
							Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
						},
					},
				)

				// Update user data in database
				const { error: updateError } = await supabase
					.from('users')
					.update({
						username: response.data.username,
						avatar: response.data.avatar,
					})
					.eq('id', user.id)

				if (updateError) {
					console.error(`Failed to update user ${user.id}:`, updateError)
				}
			} catch (apiError) {
				console.error(`Failed to fetch Discord user ${user.id}:`, apiError)
				continue
			}
		}
	} catch (error) {
		console.error('Failed to update users:', error)
	}
}

export function startUserUpdateCron() {
	cron.schedule('0 */6 * * *', () => {
		console.log('Running scheduled user update')
		updateUsers()
	})
}
