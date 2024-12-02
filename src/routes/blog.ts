import { Router, Request, Response } from 'express'
import { supabase } from '../utils/supabase'
import { render } from '../utils/request'
import { marked } from 'marked'
import multer from 'multer'
import { storage } from '../utils/storage'
import { authMiddleware, requireAdmin as adminMiddleware } from '../middleware/auth'
import { Readable } from 'stream'
import { v4 as uuidv4 } from 'uuid'
import { registry } from '../build/components/registry';

const router = Router()
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
})

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
    return content.replace(/:::(\w+)(?:{([^}]*)})?\s*([\s\S]*?):::/g, (match, name, props, children) => {
        try {
            // Safely parse properties
            const componentProps = props ? parseProps(props) : {};
            componentProps.children = children.trim();
            return registry.render(name, componentProps);
        } catch (error) {
            console.error(`Error rendering component ${name}:`, error);
            return `<div class="alert alert-danger">Error rendering component ${name}</div>`;
        }
    });
}

function parseProps(props: string): Record<string, any> {
    try {
        // Convert the props string into a valid JSON format
        const formattedProps = `{${props.replace(/(\w+)=/g, '"$1":').replace(/=/g, ':')}}`;
        return JSON.parse(formattedProps);
    } catch (error) {
        console.error('Error parsing properties:', error);
        return {};
    }
}

// Blog index page
router.get('/', async (req: Request, res: Response) => {
    try {
        const { data: posts, error } = await supabase
            .from('blog')
            .select(`
                *,
                author:author_id (
                    id,
                    username,
                    avatar
                )
            `)
            .eq('status', 'published')
            .order('published_at', { ascending: false })

        if (error) throw error

        render(req, res, 'blog/index', {
            title: 'Blog',
            posts
        })
    } catch (error) {
        console.error('Blog error:', error)
        res.status(500).render('error', {
            error: 'Failed to load blog posts'
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
            .select(`
                *,
                author:author_id (
                    id,
                    username,
                    avatar
                )
            `)
            .eq('slug', slug)
            .eq('status', 'published')
            .single()

        if (error || !post) {
            return res.status(404).render('error', {
                error: 'Blog post not found'
            })
        }

        // Convert markdown to HTML
        post.contentHtml = marked(post.content)

        // Get previous and next posts
        const { data: siblings } = await supabase
            .from('blog')
            .select('id, title, slug, published_at')
            .eq('status', 'published')
            .order('published_at', { ascending: false })

        const currentIndex = siblings?.findIndex(p => p.id === post.id) ?? -1
        const previousPost = currentIndex > 0 ? siblings?.[currentIndex - 1] : null
        const nextPost = currentIndex < (siblings?.length ?? 0) - 1 ? siblings?.[currentIndex + 1] : null

        // Get related posts (posts with matching tags)
        const { data: relatedPosts } = await supabase
            .from('blog')
            .select(`
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
            `)
            .eq('status', 'published')
            .neq('id', post.id)
            .contains('tags', post.tags)
            .limit(4)
            .order('published_at', { ascending: false })

        const processedContent = await renderBlogPostContent(post.content)

        render(req, res, 'blog/post', {
            title: post.title,
            post,
            content: processedContent,
            previousPost,
            nextPost,
            relatedPosts: relatedPosts || []
        })
    } catch (error) {
        console.error('Blog post error:', error)
        res.status(500).render('error', {
            error: 'Failed to load blog post'
        })
    }
})

// Upload blog image
//@ts-ignore
router.post('/upload/image', authMiddleware, adminMiddleware, upload.single('image'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' })
        }

        const postId = req.body.postId || 'temp'
        const imageType = req.body.type as 'cover' | 'content'

        const filename = await storage.saveBlogImage(postId, imageType, req.file)
        
        res.json({
            url: `/media/blog/${postId}/${filename}`
        })
    } catch (error) {
        console.error('Image upload error:', error)
        res.status(500).json({ error: 'Failed to upload image' })
    }
})

// Create/Update blog post
router.post('/post', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { title, content, tags, excerpt, status, featuredImage, postId } = req.body

        // Generate a new ID for new posts
        const id = postId === 'temp' ? uuidv4() : postId

        // Generate and ensure unique slug
        const baseSlug = generateSlug(title)
        const slug = await ensureUniqueSlug(baseSlug, id)

        // Download and process any images in the content
        const processedContent = await storage.processBlogContent(content, slug)
        
        // Sanitize the processed content
        const sanitizedContent = await storage.sanitizeBlogContent(processedContent)

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
                path: ''
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
            cover_image: coverImage
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
})

export default router