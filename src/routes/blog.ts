import { Router, Request, Response } from 'express'
import { supabase } from '../utils/supabase'
import { render } from '../utils/request'
import { marked } from 'marked'
import multer from 'multer'
import { storage } from '../utils/storage'
import {
	authMiddleware,
	requireAdmin as adminMiddleware,
} from '../middleware/auth'
import { Readable } from 'stream'
import { v4 as uuidv4 } from 'uuid'
import { registry } from '../build/components/registry'
import he from 'he'
import hljs from 'highlight.js'
import matter from 'gray-matter'

const router = Router()
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},
})

// Configure marked
marked.setOptions({
	//@ts-ignore
	langPrefix: 'hljs language-',
	//@ts-ignore
	highlight: (code, lang) => {
		if (lang && hljs.getLanguage(lang)) {
			try {
				return hljs.highlight(code, {
					language: lang,
					ignoreIllegals: true,
				}).value
			} catch (err) {
				console.error('Highlight.js error:', err)
			}
		}
		return code // Use plain text if language not found
	},
	renderer: (() => {
		const renderer = new marked.Renderer()

		// Custom link renderer
		//@ts-ignore
		renderer.link = (data) => {
			const linkRegex = /^(https?:\/\/|mailto:|\/docs\/)/
			const isExternal = linkRegex.test(data.href || '')
			return `<a href="${data.href}" ${isExternal ? 'target="_blank" rel="noopener"' : ''} 
                      ${data.title ? `title="${data.title}"` : ''}>${data.text}</a>`
		}

		// Custom code block renderer
		//@ts-ignore
		renderer.code = (data) => {
			return `<div class="code-block">
                      <div class="code-header">
                          <span class="code-language">${data.lang || 'plaintext'}</span>
                          <button class="copy-button" onclick="copyCode(this)">
                              <i class="bi bi-clipboard"></i>
                          </button>
                      </div>
                      <pre><code class="hljs language-${data.lang || 'plaintext'}">${data.text}</code></pre>
                   </div>`
		}

		// Custom inline code renderer
		renderer.codespan = (data) => {
			return `<code class="inline-code">${data.text}</code>`
		}

		return renderer
	})(),
})

marked.use({
	extensions: [
		{
			name: 'component',
			level: 'block',
			start(src: string) {
				return src.match(/^:::[a-zA-Z]+/)?.index
			},
			tokenizer(src: string) {
				const match = src.match(
					/^:::([\w-]+)(?:{([^}]+)})?\s+([\s\S]*?):::(?:\n|$)/,
				)
				if (match) {
					let props = {}
					if (match[2]) {
						try {
							// Parse props string into key-value pairs
							props = match[2].split(',').reduce(
								(acc, prop) => {
									const [key, value] = prop.trim().split('=')
									if (key && value) {
										// Remove quotes if present
										acc[key.trim()] = value
											.trim()
											.replace(/^["'](.+)["']$/, '$1')
									}
									return acc
								},
								{} as Record<string, string>,
							)
						} catch (error) {
							console.warn(
								`Warning: Failed to parse props for component ${match[1]}`,
								error,
							)
						}
					}

					return {
						type: 'component',
						raw: match[0],
						name: match[1],
						props,
						content: match[3].trim(),
					}
				}
			},
			renderer(token: any) {
				try {
					return registry.render(token.name, {
						...token.props,
						children: marked.parse(token.content),
					})
				} catch (error) {
					console.error(`Error rendering component ${token.name}:`, error)
					return `<div class="alert alert-danger">Error rendering component ${token.name}</div>`
				}
			},
		},
	],
})

async function renderMarkdown(content: string): Promise<{ html: string }> {
	try {
		const html = await marked.parse(content)
		return { html }
	} catch (error) {
		console.error('Error processing markdown:', error)
		throw error
	}
}

// Helper function to generate slug
function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^\w\s-]/g, '') // Remove special characters
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
		.trim()
}

// Helper function to ensure unique slug
async function ensureUniqueSlug(baseSlug: string, id: string): Promise<string> {
	const { data: posts, error } = await supabase
		.from('blog')
		.select('slug')
		.eq('slug', baseSlug)
		.eq('id', id)

	if (error) throw error

	if (posts && posts.length > 0) {
		const existingSlug = posts[0].slug
		const slug = baseSlug + '-' + Date.now().toString()
		return slug
	}

	return baseSlug
}

async function renderBlogPostContent(content: string): Promise<string> {
	return content.replace(
		/:::(\w+)(?:{([^}]*)})?\s*([\s\S]*?):::/g,
		(match, name, props, children) => {
			try {
				// Safely parse properties
				const componentProps = props ? parseProps(props) : {}
				componentProps.children = children.trim()

				return registry.render(name, componentProps)
			} catch (error) {
				console.error(`Error rendering component ${name}:`, error)
				return `<div class="alert alert-danger">Error rendering component ${name}</div>`
			}
		},
	)
}

function parseProps(props: string): Record<string, any> {
	try {
		// Decode HTML entities
		const decodedProps = he.decode(props)
		// Convert the props string into a valid JSON format
		const formattedProps = `{${decodedProps.replace(/(\w+)=/g, '"$1":').replace(/=/g, ':')}}`
		return JSON.parse(formattedProps)
	} catch (error) {
		console.error('Error parsing properties:', error)
		return {}
	}
}

// Blog index page
router.get('/', async (req: Request, res: Response) => {
	try {
		const { data: posts, error } = await supabase
			.from('blog')
			.select(
				`
                *,
                author:author_id (
                    id,
                    username,
                    avatar
                )
            `,
			)
			.eq('status', 'published')
			.order('published_at', { ascending: false })

		if (error) throw error

		render(req, res, 'blog/index', {
			title: 'Blog',
			posts,
		})
	} catch (error) {
		console.error('Blog error:', error)
		res.status(500).render('error', {
			error: 'Failed to load blog posts',
		})
	}
})

// Individual blog post page
router.get('/:slug', async (req: Request, res: Response) => {
	try {
		const { slug } = req.params

		// Get current post
		const { data: post, error } = await supabase
			.from('blog')
			.select(
				`
                *,
                author:author_id (
                    id,
                    username,
                    avatar
                )
            `,
			)
			.eq('slug', slug)
			.eq('status', 'published')
			.single()

		if (error || !post) {
			return res.status(404).render('error', {
				error: 'Blog post not found',
			})
		}

		// Get previous and next posts
		const { data: siblings } = await supabase
			.from('blog')
			.select('id, title, slug, published_at')
			.eq('status', 'published')
			.order('published_at', { ascending: false })

		const currentIndex = siblings?.findIndex((p) => p.id === post.id) ?? -1
		const previousPost = currentIndex > 0 ? siblings?.[currentIndex - 1] : null
		const nextPost =
			currentIndex < (siblings?.length ?? 0) - 1 ?
				siblings?.[currentIndex + 1]
			:	null

		// Get related posts (posts with matching tags)
		const { data: relatedPosts } = await supabase
			.from('blog')
			.select(
				`
                id,
                title,
                slug,
                excerpt,
                coverImage,
                published_at,
                author:author_id (
                    id,
                    username,
                    avatar
                )
            `,
			)
			.eq('status', 'published')
			.neq('id', post.id)
			.contains('tags', post.tags)
			.limit(4)
			.order('published_at', { ascending: false })

		const { html } = await renderMarkdown(post.content)

		render(req, res, 'blog/post', {
			title: post.title,
			post,
			content: html,
			previousPost,
			nextPost,
			relatedPosts: relatedPosts || [],
		})
	} catch (error) {
		console.error('Blog post error:', error)
		res.status(500).render('error', {
			error: 'Failed to load blog post',
		})
	}
})

// Upload blog image
//@ts-ignore
router.post(
	'/upload/image',
	authMiddleware,
	adminMiddleware,
	upload.single('image'),
    //@ts-ignore
	async (req: Request, res: Response) => {
		try {
			if (!req.file) {
				return res.status(400).json({ error: 'No image file provided' })
			}

			const postId = req.body.postId || 'temp'
			const imageType = req.body.type as 'cover' | 'content'

			const filename = await storage.saveBlogImage(postId, imageType, req.file)

			res.json({
				url: `/media/blog/${postId}/${filename}`,
			})
		} catch (error) {
			console.error('Image upload error:', error)
			res.status(500).json({ error: 'Failed to upload image' })
		}
	},
)

// Create/Update blog post
router.post(
	'/post',
	authMiddleware,
	adminMiddleware,
	async (req: Request, res: Response) => {
		try {
			const { title, content, tags, excerpt, status, featuredImage, postId } =
				req.body

			// Generate a new ID for new posts
			const id = postId === 'temp' ? uuidv4() : postId

			// Generate and ensure unique slug
			const baseSlug = generateSlug(title)
			const slug = await ensureUniqueSlug(baseSlug, id)

			// Download and process any images in the content
			const processedContent = await storage.processBlogContent(content, slug)

			// Sanitize the processed content
			const sanitizedContent =
				await storage.sanitizeBlogContent(processedContent)

			// If there's a featured image (base64), convert and save it
			let coverImage = false
			if (featuredImage && featuredImage.startsWith('data:image')) {
				const base64Data = featuredImage.split(',')[1]
				const imageBuffer = Buffer.from(base64Data, 'base64')

				const file: Express.Multer.File = {
					buffer: imageBuffer,
					originalname: 'cover.jpg',
					fieldname: 'image',
					encoding: '7bit',
					mimetype: 'image/jpeg',
					size: imageBuffer.length,
					stream: Readable.from(imageBuffer),
					destination: '',
					filename: '',
					path: '',
				}

				await storage.saveBlogImage(slug, 'cover', file)
				coverImage = true
			}

			const post = {
				id,
				title,
				slug,
				content: sanitizedContent,
				tags,
				excerpt,
				status,
				author_id: req.user?.id,
				published_at: status === 'published' ? new Date().toISOString() : null,
				cover_image: coverImage,
			}

			const { data, error } = await supabase
				.from('blog')
				.upsert(post)
				.select()
				.single()

			if (error) throw error

			res.json(data)
		} catch (error) {
			console.error('Blog post error:', error)
			res.status(500).json({ error: 'Failed to save blog post' })
		}
	},
)

export default router
