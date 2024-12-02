import express, { Request, Response } from 'express'
import { requireAdmin } from '../middleware/auth'
import { storage } from '../utils/storage'
import { render } from '../utils/request'
import * as media from '../utils/media'
import { config } from '../config'
import * as malScraper from 'mal-scraper'
import { supabase } from '../utils/supabase'
import crypto from 'crypto'

const router = express.Router()

// Protect all admin routes
router.use(requireAdmin)

// Admin dashboard
router.get('/', async (req: Request, res: Response) => {
	try {
		// Get basic stats
		const users = await storage.getAllUsers()
		const anime = await storage.getAllAnime()

		const stats = {
			totalUsers: Object.keys(users).length,
			totalAnime: anime.length,
			totalEpisodes: 0,
			recentUsers: Object.values(users)
				.sort(
					(a, b) =>
						new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime(),
				)
				.slice(0, 5),
		}

		render(req, res, 'admin/dashboard', {
			title: 'Admin Dashboard',
			stats,
		})
	} catch (error) {
		console.error('Admin dashboard error:', error)
		render(req, res, 'error', {
			title: 'Error',
			error: 'Failed to load admin dashboard',
		})
	}
})

// User management
router.get('/users', async (req: Request, res: Response) => {
	try {
		const users = await storage.getAllUsers()
		render(req, res, 'admin/users', {
			title: 'User Management',
			users: Object.values(users),
		})
	} catch (error) {
		console.error('User management error:', error)
		render(req, res, 'error', {
			title: 'Error',
			error: 'Failed to load user management',
		})
	}
})

// Update user roles
//@ts-ignore
router.post('/users/:userId/roles', async (req: Request, res: Response) => {
	try {
		const { userId } = req.params
		const { roles } = req.body

		const user = await storage.getUser(userId)
		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		}

		user.roles = Array.isArray(roles) ? roles : [roles]
		await storage.saveUser(user)

		res.json({ success: true })
	} catch (error) {
		res.status(500).json({ error: 'Failed to update user roles' })
	}
})

// Media management
router.get('/media', async (req: Request, res: Response) => {
	try {
		const anime = await storage.getAllAnime()
		render(req, res, 'admin/media', {
			title: 'Media Management',
			anime,
		})
	} catch (error) {
		console.error('Media management error:', error)
		render(req, res, 'error', {
			title: 'Error',
			error: 'Failed to load media management',
		})
	}
})

// Scan media directories
router.post('/media/scan', async (req: Request, res: Response) => {
	try {
		await Promise.all(config.media.map((dir) => media.scanMediaDirectory(dir)))
		res.json({ success: true })
	} catch (error) {
		res.status(500).json({ error: 'Failed to scan media directories' })
	}
})

// Refresh metadata for specific anime
//@ts-ignore
router.post('/media/:animeId/refresh', async (req: Request, res: Response) => {
	try {
		const { animeId } = req.params
		const anime = await storage.getAnime(animeId)

		if (!anime || !anime.malId) {
			return res.status(404).json({ error: 'Anime not found or no MAL ID' })
		}

		// Fetch fresh metadata from MAL
		const malData = await media.getMALData(anime.malId)
		if (!malData) {
			return res.status(404).json({ error: 'Failed to fetch MAL data' })
		}

		// Update anime metadata
		anime.description = malData.synopsis || anime.description
		anime.genre = malData.genres || anime.genre
		anime.updatedAt = new Date().toISOString()

		await storage.updateAnime(anime)

		res.json({ success: true })
	} catch (error) {
		console.error('Metadata refresh error:', error)
		res.status(500).json({ error: 'Failed to refresh metadata' })
	}
})

// Delete media entry
router.delete('/media/:animeId', async (req: Request, res: Response) => {
	try {
		const { animeId } = req.params
		await storage.deleteAnime(animeId)
		res.json({ success: true })
	} catch (error) {
		console.error('Media deletion error:', error)
		res.status(500).json({ error: 'Failed to delete media entry' })
	}
})

// Suggestions management
router.get('/suggestions', async (req: Request, res: Response) => {
	try {
		const suggestions = await storage.getAllSuggestions()
		render(req, res, 'admin/suggestions', {
			title: 'Suggestion Management',
			suggestions,
		})
	} catch (error) {
		console.error('Suggestion management error:', error)
		render(req, res, 'error', {
			title: 'Error',
			error: 'Failed to load suggestions',
		})
	}
})

// Update suggestion status
router.post('/suggestions/:id/status', async (req: Request, res: Response) => {
	try {
		const { id } = req.params
		const { status, reviewNote } = req.body

		await storage.updateSuggestion(id, {
			status,
			reviewNote,
			reviewedBy: (req as any).user.id,
			updatedAt: new Date().toISOString(),
		})

		res.json({ success: true })
	} catch (error) {
		console.error('Update suggestion error:', error)
		res.status(500).json({ error: 'Failed to update suggestion' })
	}
})

router.get('/mal/:malId', async (req: Request, res: Response) => {
	const { malId } = req.params
	const malData = await malScraper.getInfoFromURL(
		`https://myanimelist.net/anime/${malId}`,
	)
	res.json(malData)
})

// Blog management
router.get('/blog', async (req: Request, res: Response) => {
	try {
		const { data: posts } = await supabase
			.from('blog')
			.select('*')
			.order('created_at', { ascending: false });

		render(req, res, 'admin/blog', {
			title: 'Blog Management',
			posts: posts || [],
		});
	} catch (error) {
		console.error('Blog management error:', error);
		render(req, res, 'error', {
			title: 'Error',
			error: 'Failed to load blog management'
		});
	}
});

// Create/Update blog post
router.post('/blog/:id?', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { title, content, excerpt, status, tags, featured_image } = req.body;
		
		const slug = title.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');

		const postData = {
			title,
			slug,
			content,
			excerpt,
			status,
			tags: Array.isArray(tags) ? tags : [],
			featured_image,
			author_id: (req as any).user.id,
			published_at: status === 'published' ? new Date().toISOString() : null,
			updated_at: new Date().toISOString()
		};

		if (id) {
			// Update existing post
			await supabase
				.from('blog')
				.update(postData)
				.eq('id', id);
		} else {
			// Create new post
			await supabase
				.from('blog')
				.insert([{ ...postData, id: crypto.randomUUID() }]);
		}

		res.json({ success: true });
	} catch (error) {
		console.error('Blog post error:', error);
		res.status(500).json({ error: 'Failed to save blog post' });
	}
});

// Delete blog post

router.delete('/blog/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		await supabase
			.from('blog')
			.delete()
			.eq('id', id);
		res.json({ success: true });
	} catch (error) {
		console.error('Blog deletion error:', error);
		res.status(500).json({ error: 'Failed to delete blog post' });
	}
});

// Add this new route to get a single post
//@ts-ignore
router.get('/blog/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data: post, error } = await supabase
            .from('blog')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!post) return res.status(404).json({ error: 'Post not found' });

        res.json(post);
    } catch (error) {
        console.error('Get blog post error:', error);
        res.status(500).json({ error: 'Failed to fetch blog post' });
    }
});

export default router
