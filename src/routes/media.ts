import express, { Request, Response, Router } from 'express'
import * as path from 'path'
import * as fs from 'fs'
import { config } from '../config'

const router = Router()

//@ts-ignore
router.get('/:type/:animeName', async (req: Request, res: Response) => {
	const { type, animeName } = req.params

	// Validate type parameter
	if (type !== 'cover' && type !== 'banner') {
		return res.status(400).send('Invalid media type')
	}

	try {
		// Try each media directory until we find the image
		for (const mediaDir of config.media) {
			const imagePath = path.join(mediaDir, animeName, `${type}.jpg`)

			// Check if file exists in this directory
			if (fs.existsSync(imagePath)) {
				// Set proper content type and send file
				res.type('image/jpeg')
				return res.sendFile(imagePath)
			}
		}

		// If we get here, the image wasn't found in any directory
		return res.status(404).send('Image not found')
	} catch (error) {
		console.error(`Error serving media file:`, error)
		res.status(500).send('Internal server error')
	}
})

export default router
