import express, { Request, Response } from 'express'
import * as fs from 'fs'
import * as path from 'path'
import { config } from '../config'
import * as storage from '../utils/storage'
import * as media from '../utils/media'

const router = express.Router()

//@ts-ignore
router.get('/:animeId/:season/:episode', (req: Request, res: Response) => {
	// Decode URI components and clean up parameters
	const animeId = decodeURIComponent(req.params.animeId)
	const season = decodeURIComponent(req.params.season)
	const episode = decodeURIComponent(req.params.episode)

	// Ensure the file exists
	const videoPath = media.getEpisodePath(animeId, season, episode)

	if (!videoPath) {
		console.log(`Video not found: ${animeId}/${season}/${episode}`)
		return res.status(404).send('Video not found')
	}

	// Get file stats
	const stat = fs.statSync(videoPath)
	const fileSize = stat.size
	const range = req.headers.range

	if (range) {
		// Parse range
		const parts = range.replace(/bytes=/, '').split('-')
		const start = parseInt(parts[0], 10)
		const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
		const chunksize = end - start + 1
		const file = fs.createReadStream(videoPath, { start, end })
		const head = {
			'Content-Range': `bytes ${start}-${end}/${fileSize}`,
			'Accept-Ranges': 'bytes',
			'Content-Length': chunksize,
			'Content-Type': 'video/mp4',
		}

		res.writeHead(206, head)
		file.pipe(res)
	} else {
		const head = {
			'Content-Length': fileSize,
			'Content-Type': 'video/mp4',
		}

		res.writeHead(200, head)
		fs.createReadStream(videoPath).pipe(res)
	}
})

export default router
