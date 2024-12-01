import express from 'express'
import { requireAuth } from '../middleware/auth'
import { storage } from '../utils/storage'
import { render } from '../utils/request'
import * as malScraper from 'mal-scraper'

const router = express.Router()

// Suggestion page
router.get('/', requireAuth, (req, res) => {
	render(req, res, 'suggest', {
		title: 'Suggest Anime',
	})
})

// Preview anime from MAL URL
//@ts-ignore
router.get('/api/anime/preview', requireAuth, async (req, res) => {
	try {
		const { url } = req.query
		if (!url || typeof url !== 'string') {
			return res.status(400).json({ error: 'Invalid URL' })
		}

		// Extract MAL ID from URL
		const malId = url.match(/anime\/(\d+)/)?.[1]
		if (!malId) {
			return res.status(400).json({ error: 'Invalid MyAnimeList URL' })
		}

		// Fetch anime data from MAL
		const data = await malScraper.getInfoFromURL(url)
		if (!data) {
			return res.status(404).json({ error: 'Anime not found' })
		}

		res.json({
			malId: parseInt(malId),
			title: data.title,
			synopsis: data.synopsis,
			image: data.picture,
			type: data.type,
			status: data.status,
		})
	} catch (error) {
		console.error('Preview error:', error)
		res.status(500).json({ error: 'Failed to fetch anime data' })
	}
})

// Submit suggestion
router.post('/api/suggestions', requireAuth, async (req, res) => {
	try {
		const suggestion = {
			id: `suggestion_${Date.now()}`,
			userId: (req as any).user.id,
			status: 'pending',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			...req.body,
		}

		await storage.saveSuggestion(suggestion)
		res.json({ success: true })
	} catch (error) {
		console.error('Suggestion error:', error)
		res.status(500).json({ error: 'Failed to save suggestion' })
	}
})

// Get user's suggestions
router.get('/api/suggestions/mine', requireAuth, async (req, res) => {
	try {
		const suggestions = await storage.getUserSuggestions((req as any).user.id)
		res.json(suggestions)
	} catch (error) {
		console.error('Get suggestions error:', error)
		res.status(500).json({ error: 'Failed to load suggestions' })
	}
})

export default router
