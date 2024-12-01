import express, { Request, Response } from 'express'
import * as fs from 'fs'
import * as path from 'path'

const router = express.Router()

//@ts-ignore
router.get('/:path(*)', (req: Request, res: Response) => {
	const videoPath = path.resolve('/', req.params.path)

	// Ensure the file exists
	if (!fs.existsSync(videoPath)) {
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
