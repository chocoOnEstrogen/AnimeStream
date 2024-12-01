import express from 'express'
import path from 'path'
import { promises as fs } from 'fs'
import { storage } from '../utils/storage'
import { render } from '../utils/request'

const router = express.Router()
const BUILD_DIR = path.join(process.cwd(), 'dist', 'docs')

interface DocMetadata {
	title: string
	description?: string
	dateAdded?: string
	lastUpdated?: string
	author?: string
	tags?: string[]
	order?: number
	category?: string
	related?: string[]
}

interface DocFile {
	slug: string
	category: string
	title: string
	path: string
	metadata: DocMetadata
	html: string
}

interface DocsData {
	docs: DocFile[]
	categories: string[]
}

// Cache the docs in memory
let docsCache: DocsData | null = null

async function loadDocs(): Promise<DocsData> {
	if (docsCache) return docsCache

	const data = await fs.readFile(path.join(BUILD_DIR, 'docs.json'), 'utf-8')
	docsCache = JSON.parse(data) as DocsData
	return docsCache
}

router.get('/', async (req, res) => {
	try {
		const data = await loadDocs()
		if (!data) throw new Error('Failed to load documentation')

		render(req, res, 'docs/index', {
			title: 'API Documentation',
			docs: data.docs,
			categories: data.categories,
			currentSlug: null,
			currentCategory: null,
			isAuthenticated: (req as any).isAuthenticated,
		})
	} catch (error) {
		console.error('Error loading docs:', error)
		render(req, res, 'error', {
			error: 'Failed to load documentation',
			isAuthenticated: (req as any).isAuthenticated,
		})
	}
})

router.get('/:category/:slug', async (req, res) => {
	try {
		const { category, slug } = req.params
		const data = await loadDocs()
		if (!data) throw new Error('Failed to load documentation')

		const doc = data.docs.find(
			(d) => d.category === category && d.slug === slug,
		)
		if (!doc) throw new Error('Document not found')

		// Get related documents
		const relatedDocs =
			doc.metadata.related ?
				data.docs.filter((d) =>
					doc.metadata.related?.includes(`${d.category}/${d.slug}`),
				)
			:	[]

		// Get author information
		let author = null
		if (doc.metadata.author) {
			author = await storage.getUser(doc.metadata.author)
		}

		render(req, res, 'docs/page', {
			title: doc.title,
			content: doc.html,
			metadata: doc.metadata,
			docs: data.docs,
			categories: data.categories,
			currentCategory: category,
			currentSlug: slug,
			relatedDocs,
			author,
			isAuthenticated: (req as any).isAuthenticated,
		})
	} catch (error) {
		console.error('Error loading doc:', error)
		render(req, res, 'error', {
			error: 'Documentation page not found',
			isAuthenticated: (req as any).isAuthenticated,
		})
	}
})

export default router
