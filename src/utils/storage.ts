import * as fs from 'fs/promises'
import * as path from 'path'
import { User, UserStore } from '../types/user'
import { Anime } from '../types/anime'
import { config } from '../config'
import { scanMediaDirectory } from './media'
import { Suggestion } from '../types/suggestion'

class Storage {
	private usersPath: string
	private users: UserStore = {}
	private animeCache: Map<string, Anime> = new Map()
	private lastCacheUpdate: number = 0
	private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
	private suggestionsPath = path.join(__dirname, '../../data/suggestions.json')
	private suggestions: { [id: string]: Suggestion } = {}

	constructor() {
		this.usersPath = path.join(__dirname, '../../data/users.json')
		this.initStorage()
		this.initSuggestions()
	}

	private async initStorage() {
		try {
			// Create data directory if it doesn't exist
			await fs.mkdir(path.dirname(this.usersPath), { recursive: true })

			// Try to read existing users
			try {
				const data = await fs.readFile(this.usersPath, 'utf-8')
				this.users = JSON.parse(data)
			} catch (error) {
				// If file doesn't exist, create empty storage
				await this.saveUsers()
			}
		} catch (error) {
			console.error('Failed to initialize storage:', error)
		}
	}

	private async initSuggestions() {
		try {
			await fs.mkdir(path.dirname(this.suggestionsPath), { recursive: true })
			const data = await fs.readFile(this.suggestionsPath, 'utf-8')
			this.suggestions = JSON.parse(data)
		} catch (error) {
			await this.saveSuggestions()
		}
	}

	private async saveUsers(): Promise<void> {
		try {
			await fs.writeFile(this.usersPath, JSON.stringify(this.users, null, 2))
		} catch (error) {
			console.error('Failed to save users:', error)
		}
	}

	private async saveSuggestions(): Promise<void> {
		await fs.writeFile(
			this.suggestionsPath,
			JSON.stringify(this.suggestions, null, 2),
		)
	}

	async saveSuggestion(suggestion: Suggestion): Promise<void> {
		this.suggestions[suggestion.id] = suggestion
		await this.saveSuggestions()
	}

	async getUserSuggestions(userId: string): Promise<Suggestion[]> {
		return Object.values(this.suggestions)
			.filter((s) => s.userId === userId)
			.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			)
	}

	async getAllSuggestions(): Promise<Suggestion[]> {
		return Object.values(this.suggestions).sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		)
	}

	async updateSuggestion(
		id: string,
		update: Partial<Suggestion>,
	): Promise<void> {
		if (!this.suggestions[id]) throw new Error('Suggestion not found')

		this.suggestions[id] = {
			...this.suggestions[id],
			...update,
			updatedAt: new Date().toISOString(),
		}

		await this.saveSuggestions()
	}

	private async refreshAnimeCache(): Promise<void> {
		try {
			const now = Date.now()
			if (
				now - this.lastCacheUpdate < this.CACHE_TTL &&
				this.animeCache.size > 0
			) {
				return // Use cached data if it's fresh
			}

			// Clear existing cache
			this.animeCache.clear()

			// Scan all media directories
			const animeList = (
				await Promise.all(config.media.map((dir) => scanMediaDirectory(dir)))
			).flat()

			// Update cache
			animeList.forEach((anime) => {
				this.animeCache.set(anime.id, anime as any)
			})

			this.lastCacheUpdate = now
		} catch (error) {
			console.error('Failed to refresh anime cache:', error)
		}
	}

	async getUser(id: string): Promise<User | null> {
		return this.users[id] || null
	}

	async saveUser(user: User): Promise<void> {
		this.users[user.id] = user
		await this.saveUsers()
	}

	async deleteUser(id: string): Promise<void> {
		delete this.users[id]
		await this.saveUsers()
	}

	async getAnime(id: string): Promise<Anime | null> {
		await this.refreshAnimeCache()
		if (id === 'undefined') return null
		return this.animeCache.get(id) || null
	}

	async getAllAnime(): Promise<Anime[]> {
		await this.refreshAnimeCache()
		return Array.from(this.animeCache.values())
	}

	async searchAnime(query: string): Promise<Anime[]> {
		await this.refreshAnimeCache()
		const searchTerm = query.toLowerCase()

		return Array.from(this.animeCache.values()).filter(
			(anime) =>
				anime.title.toLowerCase().includes(searchTerm) ||
				anime.description.toLowerCase().includes(searchTerm),
		)
	}

	async addToWatchHistory(
		userId: string,
		animeId: string,
		season: string,
		episode: string,
		progress: number,
	): Promise<void> {
		const user = await this.getUser(userId)
		if (!user) return

		// Initialize watch history if it doesn't exist
		user.watchHistory = user.watchHistory || []

		// Remove existing entry for this episode if exists
		user.watchHistory = user.watchHistory.filter(
			(entry) =>
				!(
					entry.animeId === animeId &&
					entry.season === season &&
					entry.episode === episode
				),
		)

		// Add new entry at the beginning
		user.watchHistory.unshift({
			animeId,
			season,
			episode,
			timestamp: Date.now(),
			progress,
		})

		// Keep only last 100 entries
		user.watchHistory = user.watchHistory.slice(0, 100)

		await this.saveUser(user)
	}

	async getWatchHistory(
		userId: string,
		limit?: number,
	): Promise<
		Array<{
			anime: Anime | null
			season: string
			episode: string
			timestamp: number
			progress: number
		}>
	> {
		const user = await this.getUser(userId)
		if (!user || !user.watchHistory) return []

		const history = await Promise.all(
			user.watchHistory.slice(0, limit).map(async (entry) => ({
				...entry,
				anime: await this.getAnime(entry.animeId),
			})),
		)

		return history.filter((entry) => entry.anime !== null)
	}

	async toggleFavorite(userId: string, animeId: string): Promise<boolean> {
		const user = await this.getUser(userId)
		if (!user) return false

		if (animeId === 'undefined') return false

		// Initialize favorites if it doesn't exist
		user.favoriteAnime = user.favoriteAnime || []

		// Toggle favorite status
		const index = user.favoriteAnime.indexOf(animeId)
		if (index === -1) {
			user.favoriteAnime.push(animeId)
			await this.saveUser(user as User)
			return true
		} else {
			user.favoriteAnime.splice(index, 1)
			await this.saveUser(user as User)
			return false
		}
	}

	async isFavorite(userId: string, animeId: string): Promise<boolean> {
		const user = await this.getUser(userId)
		return user?.favoriteAnime?.includes(animeId) || false
	}

	async getAllUsers(): Promise<User[]> {
		return Object.values(this.users)
	}

	async updateUserRoles(userId: string, roles: string[]): Promise<void> {
		const user = await this.getUser(userId)
		if (!user) throw new Error('User not found')

		user.roles = roles
		await this.saveUser(user)
	}

	async updateAnime(anime: Anime): Promise<void> {
		this.animeCache.set(anime.id, anime)
		// Force a cache refresh on next fetch
		this.lastCacheUpdate = 0
	}

	async deleteAnime(animeId: string): Promise<void> {
		this.animeCache.delete(animeId)
		// Force a cache refresh on next fetch
		this.lastCacheUpdate = 0
	}
}

export const storage = new Storage()
