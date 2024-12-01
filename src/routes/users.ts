import express, { Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { storage } from '../utils/storage'
import { User } from '../types/user'
import { render } from '../utils/request'

const router = express.Router()

// Profile page
router.get(
	'/profile/:id?',
	requireAuth,
	async (req: Request, res: Response) => {
		try {
			// If no ID provided, show own profile
			const userId = req.params.id || (req as any).user.id
			const user = await storage.getUser(userId)
			const isAuthenticated = (req as any).user.id === userId

			if (!user) {
				return render(req, res, 'error', {
					title: 'Not Found',
					statusCode: 404,
					error: 'User not found',
					isOwnProfile: false,
					isAuthenticated,
				})
			}

			// Get user's favorite anime details
			const favoriteAnime =
				user.favoriteAnime ?
					await Promise.all(
						user.favoriteAnime.map((id) => storage.getAnime(id)),
					)
				:	[]

			const watchHistory =
				user.watchHistory ?
					await Promise.all(
						user.watchHistory.map(async (entry) => ({
							...entry,
							anime: await storage.getAnime(entry.animeId),
						})),
					)
				:	[]

			render(req, res, 'users/profile', {
				title: `${user.username}'s Profile`,
				profile: user,
				favoriteAnime: favoriteAnime.filter((anime) => anime !== null),
				isOwnProfile: isAuthenticated,
				isAuthenticated,
				watchHistory,
			})
		} catch (error) {
			console.error('Profile error:', error)
			render(req, res, 'error', {
				title: 'Error',
				statusCode: 500,
				error: 'Failed to load profile',
				isOwnProfile: false,
				isAuthenticated: false,
			})
		}
	},
)

// Edit profile
router.get('/settings', requireAuth, (req: Request, res: Response) => {
	render(req, res, 'users/settings', {
		title: 'Account Settings',
	})
})

router.post('/settings', requireAuth, async (req: Request, res: Response) => {
	try {
		const user = await storage.getUser((req as any).user.id)
		if (!user) {
			return res.redirect('/auth/logout')
		}

		// Update user settings
		user.bio = req.body.bio
		user.settings = {
			theme: req.body.theme,
			autoplay: req.body.autoplay === 'true',
			notifications: req.body.notifications === 'true',
		}

		await storage.saveUser(user)
		res.redirect('/users/profile')
	} catch (error) {
		console.error('Settings error:', error)
		render(req, res, 'error', {
			title: 'Error',
			statusCode: 500,
			error: 'Failed to update settings',
		})
	}
})

// Favorite anime management
router.post(
	'/favorites/toggle/:animeId',
	requireAuth,
	//@ts-ignore
	async (req: Request, res: Response) => {
		try {
			const user = await storage.getUser((req as any).user.id)
			if (!user) {
				return res.status(401).json({ error: 'Unauthorized' })
			}

			const { animeId } = req.params
			user.favoriteAnime = user.favoriteAnime || []

			if (user.favoriteAnime.includes(animeId)) {
				user.favoriteAnime = user.favoriteAnime.filter((id) => id !== animeId)
			} else {
				user.favoriteAnime.push(animeId)
			}

			await storage.saveUser(user)
			res.json({
				success: true,
				isFavorite: user.favoriteAnime.includes(animeId),
			})
		} catch (error) {
			res.status(500).json({ error: 'Failed to update favorites' })
		}
	},
)

export default router
