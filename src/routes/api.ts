import express, { Request, Response } from 'express'
import { storage } from '../utils/storage'
import * as media from '../utils/media'
import { config } from '../config'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

const router = express.Router()

// Rate limiting
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
})

// Apply rate limiting and CORS to all API routes
router.use(apiLimiter)
router.use(cors())

// Get all anime
router.get('/anime', async (req: Request, res: Response) => {
	try {
		const anime = await storage.getAllAnime()
		res.json(anime)
	} catch (error) {
		console.error('API error:', error)
		res.status(500).json({ error: 'Failed to fetch anime list' })
	}
})

//@ts-ignore
router.get('/anime/:id', async (req: Request, res: Response) => {
	try {
		const anime = await storage.getAnime(req.params.id)
		if (!anime) {
			return res.status(404).json({ error: 'Anime not found' })
		}
		res.json(anime)
	} catch (error) {
		console.error('API error:', error)
		res.status(500).json({ error: 'Failed to fetch anime details' })
	}
})

//@ts-ignore
router.get('/search', async (req: Request, res: Response) => {
	try {
		const query = req.query.q as string
		if (!query) {
			return res.status(400).json({ error: 'Search query required' })
		}

		const results = await storage.searchAnime(query)
		res.json(results)
	} catch (error) {
		console.error('API error:', error)
		res.status(500).json({ error: 'Search failed' })
	}
})

// Get recent anime
router.get('/recent', async (req: Request, res: Response) => {
	try {
		const limit = parseInt(req.query.limit as string) || 10
		const anime = await storage.getAllAnime()

		const recentAnime = anime
			.sort(
				(a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
			)
			.slice(0, limit)

		res.json(recentAnime)
	} catch (error) {
		console.error('API error:', error)
		res.status(500).json({ error: 'Failed to fetch recent anime' })
	}
})

// Get all genres
router.get('/genres', async (req: Request, res: Response) => {
	try {
		const genres = await media.getAllGenres(config.media)
		res.json(genres)
	} catch (error) {
		console.error('API error:', error)
		res.status(500).json({ error: 'Failed to fetch genres' })
	}
})

// Get anime by genre
router.get('/genres/:genre', async (req: Request, res: Response) => {
	try {
		const anime = await storage.getAllAnime()
		const genreAnime = anime.filter((a) =>
			a.genre.some((g) => g.toLowerCase() === req.params.genre.toLowerCase()),
		)
		res.json(genreAnime)
	} catch (error) {
		console.error('API error:', error)
		res.status(500).json({ error: 'Failed to fetch anime by genre' })
	}
})

// Get statistics
router.get('/stats', async (req: Request, res: Response) => {
	try {
		const anime = await storage.getAllAnime()
		const users = await storage.getAllUsers()

		const oneWeekAgo = new Date()
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

		const stats = {
			totalAnime: anime.length,
			totalEpisodes: anime.reduce((acc, curr) => acc + curr.episodes.length, 0),
			totalUsers: users.length,
			newThisWeek: anime.filter((a) => new Date(a.addedAt) > oneWeekAgo).length,
			activeUsers: users.filter((u) => new Date(u.lastLogin) > oneWeekAgo)
				.length,
			genres: await media.getAllGenres(config.media),
		}

		res.json(stats)
	} catch (error) {
		console.error('API error:', error)
		res.status(500).json({ error: 'Failed to fetch statistics' })
	}
})

export default router
