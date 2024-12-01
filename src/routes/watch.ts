import express, { Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { storage } from '../utils/storage'
import { render } from '../utils/request'
import { config } from '../config'
import * as media from '../utils/media'

const router = express.Router()

// const isFavorite = await storage.isFavorite((req as any).user.id, animeId);

router.get(
	'/:animeId/:season?/:episode?',
	async (req: Request, res: Response) => {
		try {
			const { animeId, season, episode } = req.params

			// Scan all media directories and combine results
			const animeList = (
				await Promise.all(
					config.media.map((dir) => media.scanMediaDirectory(dir)),
				)
			).flat()

			// Find the specific anime
			const anime = animeList.find((a) => a.id === animeId)

			if (!anime) {
				return render(req, res, 'error', {
					title: 'Not Found',
					statusCode: 404,
					error: 'Anime not found',
				})
			}

			// If no season/episode specified, redirect to first episode
			if (!season || !episode) {
				const firstSeason = Object.keys(anime.seasons)[0]
				return res.redirect(`/watch/${animeId}/${firstSeason}/1`)
			}

			// Validate season exists
			if (!anime.seasons[season]) {
				return render(req, res, 'error', {
					title: 'Not Found',
					statusCode: 404,
					error: 'Season not found',
				})
			}

			// Validate episode exists
			const episodeIndex = parseInt(episode) - 1
			if (
				isNaN(episodeIndex) ||
				episodeIndex < 0 ||
				episodeIndex >= anime.seasons[season].length
			) {
				return render(req, res, 'error', {
					title: 'Not Found',
					statusCode: 404,
					error: 'Episode not found',
				})
			}

			const episodePath = anime.seasons[season][episodeIndex]
			const nextEpisode =
				episodeIndex + 2 <= anime.seasons[season].length ?
					`/watch/${animeId}/${season}/${episodeIndex + 2}`
				:	null
			const prevEpisode =
				episodeIndex > 0 ? `/watch/${animeId}/${season}/${episodeIndex}` : null

			let isFavorite

			if ((req as any).user) {
				isFavorite = await storage.isFavorite((req as any).user.id, animeId)
			}

			render(req, res, 'watch', {
				title: `${anime.title} - ${season} Episode ${episode}`,
				anime,
				season,
				episode: parseInt(episode),
				episodePath,
				nextEpisode,
				prevEpisode,
				isFavorite,
				user: (req as any).user,
				animeId,
			})
		} catch (error) {
			console.error('Error loading watch page:', error)
			render(req, res, 'error', {
				title: 'Error',
				statusCode: 500,
				error: 'Failed to load video',
			})
		}
	},
)

// Update watch progress
router.post(
	'/:animeId/:season/:episode/progress',
	requireAuth,
	async (req, res) => {
		try {
			const { animeId, season, episode } = req.params
			const { progress } = req.body

			await storage.addToWatchHistory(
				(req as any).user.id,
				animeId,
				season,
				episode,
				parseFloat(progress),
			)

			res.json({ success: true })
		} catch (error) {
			console.error('Progress update error:', error)
			res.status(500).json({ error: 'Failed to update progress' })
		}
	},
)

// Toggle favorite status
router.post('/:animeId/favorite', requireAuth, async (req, res) => {
	try {
		const { animeId } = req.params
		const isFavorite = await storage.toggleFavorite(
			(req as any).user.id,
			animeId,
		)
		res.json({ success: true, isFavorite })
	} catch (error) {
		console.error('Favorite toggle error:', error)
		res.status(500).json({ error: 'Failed to toggle favorite status' })
	}
})

export default router
