import express, { Request, Response } from 'express'
import * as constants from './constants'
import * as request from './utils/request'
import path from 'path'
import * as media from './utils/media'
import { config } from './config'
import mediaRouter from './routes/media'
import streamRouter from './routes/stream'
import session from 'express-session'
import FileStore from 'session-file-store'
import { authMiddleware } from './middleware/auth'
import authRouter from './routes/auth'
import dotenv from 'dotenv'
import userRouter from './routes/users'
import watchRouter from './routes/watch'
import adminRouter from './routes/admin'
import { render } from './utils/request'
import { storage } from './utils/storage'
import suggestRouter from './routes/suggestions'
import cors from 'cors'
import http from 'http'
import apiRouter from './routes/api'
import docsRouter from './routes/docs'
import { startUserUpdateCron } from './utils/user'

dotenv.config()

const app = express()
const SessionStore = FileStore(session)

// Add CORS middleware before other middleware
app.use(cors({
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization']
}))

// Setup view engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))

// Session middleware
app.use(
	session({
		store: new SessionStore({
			path: path.join(__dirname, '../data/sessions'),
			ttl: 86400, // 1 day in seconds
			reapInterval: 3600, // 1 hour in seconds
			retries: 5,
			secret: config.session.secret,
		}),
		secret: config.session.secret,
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: process.env.NODE_ENV === 'production',
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
			sameSite: 'lax',
		},
	}),
)

// Auth middleware
app.use(authMiddleware)

// Auth routes
app.use('/auth', authRouter)

// Routes
app.get('/', async (req: Request, res: Response) => {
	try {
		// Get recent anime (last 6 additions)
		const allAnime = await storage.getAllAnime()
		const recentAnime = allAnime
			.sort(
				(a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
			)
			.slice(0, 6)

		request.render(req, res, 'index', {
			title: 'Home',
			recentAnime,
		})
	} catch (error) {
		console.error('Home page error:', error)
		request.render(req, res, 'error', {
			title: 'Error',
			error: 'Failed to load home page',
		})
	}
})

app.get('/recent', async (req: Request, res: Response) => {
	try {
        // Get all anime and sort by added date
        const allAnime = await storage.getAllAnime();
        const recentAnime = allAnime
            .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
            .slice(0, 10);

        // Get recent updates (metadata refreshes, new episodes, etc.)
        const recentUpdates = allAnime
            .filter(anime => anime.updatedAt !== anime.addedAt)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 10)
            .map(anime => ({
                animeId: anime.id,
                title: anime.title,
                message: 'Metadata updated',
                timestamp: anime.updatedAt
            }));

        // Calculate popular anime based on view count or watch history
        const users = await storage.getAllUsers();
        const viewCounts = new Map();
        
        // Count views from watch history
        Object.values(users).forEach(user => {
            user.watchHistory?.forEach(entry => {
                const count = viewCounts.get(entry.animeId) || 0;
                viewCounts.set(entry.animeId, count + 1);
            });
        });

        const popularAnime = allAnime
            .map(anime => ({
                ...anime,
                views: viewCounts.get(anime.id) || 0
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        // Calculate stats
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const stats = {
            newThisWeek: allAnime.filter(
                anime => new Date(anime.addedAt) > oneWeekAgo
            ).length,
            totalAnime: allAnime.length,
            activeUsers: Object.values(users).filter(user => 
                new Date(user.lastLogin).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000)
            ).length
        };

        request.render(req, res, 'recent', {
            title: 'Recent Activity',
            recentAnime,
            recentUpdates,
            popularAnime,
            stats
        });
    } catch (error) {
        console.error('Recent page error:', error);
        request.render(req, res, 'error', {
            title: 'Error',
            error: 'Failed to load recent activity'
        });
    }
})

app.get('/browse', async (req: Request, res: Response) => {
	try {
		// Scan all media directories and combine results
		const animeList = (
			await Promise.all(
				config.media.map((dir) => media.scanMediaDirectory(dir)),
			)
		).flat()

		// Sort alphabetically by title
		animeList.sort((a, b) => a.title.localeCompare(b.title))

		request.render(req, res, 'browse', {
			title: 'Browse Anime',
			animeList,
		})
	} catch (error) {
		console.error('Error scanning media directories:', error)
		res.status(500).render('error', { error: 'Failed to load anime list' })
	}
})

app.get('/details/:animeId', async (req: Request, res: Response) => {
	try {
		const title = req.params.animeId

		// Scan all media directories and combine results
		const animeList = (
			await Promise.all(
				config.media.map((dir) => media.scanMediaDirectory(dir)),
			)
		).flat()

		// Find the specific anime
		const anime = animeList.find((a) => a.id === title)

		if (!anime) {
			return res.status(404).render('error', { error: 'Anime not found' })
		}

		// Get additional MAL data if available
		let malData = null
		if (anime.malId) {
			malData = await media.getMALData(anime.malId)
		}

		request.render(req, res, 'details', {
			title: anime.title,
			anime,
			malData,
		})
	} catch (error) {
		console.error('Error loading anime details:', error)
		res.status(500).render('error', { error: 'Failed to load anime details' })
	}
})

app.get('/recent', (req: Request, res: Response) => {
	request.render(req, res, 'recent', {
		title: 'Recent Anime',
	})
})

app.get('/search', async (req: Request, res: Response) => {
	try {
		const query = req.query.q as string

		// Scan all media directories and combine results
		const animeList = (
			await Promise.all(
				config.media.map((dir) => media.scanMediaDirectory(dir)),
			)
		).flat()

		// Get all unique genres from the anime collection
		const genres = await media.getAllGenres(config.media)

		// Filter by search query if provided
		const filteredList =
			query ?
				animeList.filter(
					(anime) =>
						anime.title.toLowerCase().includes(query.toLowerCase()) ||
						anime.description.toLowerCase().includes(query.toLowerCase()),
				)
			:	animeList

		request.render(req, res, 'search', {
			title: query ? `Search: ${query}` : 'Browse Anime',
			query,
			animeList: filteredList,
			genres,
			constants,
		})
	} catch (error) {
		console.error('Search error:', error)
		res.status(500).render('error', {
			title: 'Error',
			statusCode: 500,
			error: 'Failed to load search results',
			constants,
		})
	}
})

app.use('/media', mediaRouter)
app.use('/stream', streamRouter)
app.use('/users', userRouter)
app.use('/watch', watchRouter)
app.use('/admin', adminRouter)
app.use('/suggest', suggestRouter)
app.use('/api', apiRouter)
app.use('/docs', docsRouter)

// Basic error handler
app.use(
	(
		err: Error,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		console.error(err.stack)
		request.render(req, res, 'error', {
			title: 'Error',
			statusCode: 500,
			error: 'Internal Server Error',
		})
	},
)

// 404 handler
app.use((req: express.Request, res: express.Response) => {
	request.render(req, res, 'error', {
		title: 'Not Found',
		statusCode: 404,
		error: 'Page Not Found',
	})
})

// Create HTTP server instance
const server = http.createServer(app)



server.listen(config.port as number, '0.0.0.0', async () => {
	console.clear()
	console.log(
		`${constants.APP_NAME} v${constants.APP_VERSION} is running on ${config.baseUrl}`,
	)
	startUserUpdateCron()
})

app.use((req, res, next) => {
	const oldRender = res.render
	res.render = function (view: string, options: any = {}) {
		oldRender.call(this, view, {
			...options,
			user: req.user,
			isAuthenticated: req.isAuthenticated,
			constants: config,
		})
	}
	next()
})

export { app, server }