import express, { Request, Response, Router } from 'express'
import * as path from 'path'
import * as fs from 'fs'
import { config } from '../config'

const router = Router()

// Handle blog media
//@ts-ignore
router.get('/blog/:slug/:filename', async (req: Request, res: Response) => {
	const { slug, filename } = req.params
	
	try {
		const imagePath = path.join(config.blogMedia, slug, `${filename}.jpg`)
		
		if (fs.existsSync(imagePath)) {
			res.type('image/jpeg')
			return res.sendFile(imagePath)
		}
		
		return res.status(404).send('Image not found')
	} catch (error) {
		console.error(`Error serving media file:`, error)
		res.status(500).send('Internal server error')
	}
})

//@ts-ignore
router.get('/:type/:animeName', async (req: Request, res: Response) => {
	const { type, animeName } = req.params

	if (type !== 'cover' && type !== 'banner') {
		return res.status(400).send('Invalid media type')
	}

	try {
		for (const mediaDir of config.media) {
			const imagePath = path.join(mediaDir, animeName, `${type}.jpg`)

			if (fs.existsSync(imagePath)) {
				res.type('image/jpeg')
				return res.sendFile(imagePath)
			}
		}

		return res.status(404).send('Image not found')
	} catch (error) {
		console.error(`Error serving media file:`, error)
		res.status(500).send('Internal server error')
	}
})

export default router
