import * as fs from 'fs/promises'
import * as path from 'path'
import { User, UserStore } from '../types/user'
import { Anime } from '../types/anime'
import { config } from '../config'
import { scanMediaDirectory } from './media'
import { Suggestion } from '../types/suggestion'
import { supabase } from './supabase'

class Storage {
	private users: UserStore = {}
	private animeCache: Map<string, Anime> = new Map()
	private lastCacheUpdate: number = 0
	private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

	constructor() {}

	async getUser(id: string): Promise<User | null> {
		const { data, error } = await supabase
			.from('users')
			.select('*')
			.eq('id', id)
			.single()

		if (error) {
			console.error('Error fetching user:', error)
			return null
		}

		if (!data) return null

		// Convert snake_case back to camelCase and handle date conversions
		return {
			id: data.id,
			username: data.username,
			discriminator: data.discriminator,
			avatar: data.avatar,
			email: data.email,
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			roles: data.roles,
			bio: data.bio,
			settings: data.settings,
			favoriteAnime: data.favorite_anime,
			// Convert ISO strings to timestamps if needed by your application
			createdAt: data.created_at,
			lastLogin: data.last_login,
		}
	}

	async getAllSuggestions(): Promise<Suggestion[]> {
		const { data, error } = await supabase
			.from('suggestions')
			.select('*')
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Error fetching suggestions:', error)
			return []
		}

		// Convert snake_case back to camelCase
		return data.map((suggestion) => ({
			id: suggestion.id,
			userId: suggestion.user_id,
			title: suggestion.title,
			description: suggestion.description,
			malId: suggestion.mal_id,
			priority: suggestion.priority,
			comment: suggestion.comment,
			image: suggestion.image,
			synopsis: suggestion.synopsis,
			type: suggestion.type,
			status: suggestion.status,
			reviewNote: suggestion.review_note,
			reviewedBy: suggestion.reviewed_by,
			createdAt: suggestion.created_at,
			updatedAt: suggestion.updated_at,
		}))
	}

	async updateSuggestion(
		id: string,
		update: Partial<Suggestion>,
	): Promise<void> {
		// Convert camelCase to snake_case for the update
		const dbUpdate: any = {}
		for (const [key, value] of Object.entries(update)) {
			dbUpdate[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] =
				value
		}

		const { error } = await supabase
			.from('suggestions')
			.update(dbUpdate)
			.eq('id', id)

		if (error) {
			console.error('Error updating suggestion:', error)
			throw error
		}
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

	async saveUser(user: User): Promise<void> {
		const dbUser = {
			id: user.id,
			username: user.username,
			discriminator: user.discriminator,
			avatar: user.avatar,
			email: user.email,
			access_token: user.accessToken,
			refresh_token: user.refreshToken,
			roles: user.roles,
			bio: user.bio,
			settings: user.settings,
			favorite_anime: user.favoriteAnime,
			// Convert timestamps to ISO strings
			created_at:
				user.createdAt ?
					new Date(user.createdAt).toISOString()
				:	new Date().toISOString(),
			last_login:
				user.lastLogin ?
					new Date(user.lastLogin).toISOString()
				:	new Date().toISOString(),
		}

		const { error } = await supabase
			.from('users')
			.upsert(dbUser, { onConflict: 'id' })

		if (error) {
			console.error('Error saving user:', error)
			throw error
		}
	}

	async deleteUser(id: string): Promise<void> {
		const { error } = await supabase.from('users').delete().eq('id', id)

		if (error) {
			console.error('Error deleting user:', error)
			throw error
		}
	}

	async getAnime(id: string): Promise<Anime | null> {
		await this.refreshAnimeCache()
		if (id === 'undefined') return null
		console.log(this.animeCache)
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

	async saveSuggestion(suggestion: Suggestion): Promise<void> {
		const dbSuggestion = {
			id: suggestion.id,
			user_id: suggestion.userId,
			title: suggestion.title,
			description: suggestion.description,
			mal_id: suggestion.malId,
			priority: suggestion.priority,
			comment: suggestion.comment,
			image: suggestion.image,
			synopsis: suggestion.synopsis,
			type: suggestion.type,
			status: suggestion.status,
			review_note: suggestion.reviewNote,
			reviewed_by: suggestion.reviewedBy,
			created_at: suggestion.createdAt,
			updated_at: suggestion.updatedAt,
		}

		const { error } = await supabase
			.from('suggestions')
			.upsert(dbSuggestion, { onConflict: 'id' })

		if (error) {
			console.error('Error saving suggestion:', error)
			throw error
		}
	}

	async getUserSuggestions(userId: string): Promise<Suggestion[]> {
		const { data, error } = await supabase
			.from('suggestions')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Error fetching user suggestions:', error)
			return []
		}

		// Convert snake_case back to camelCase
		return data.map((suggestion) => ({
			id: suggestion.id,
			userId: suggestion.user_id,
			title: suggestion.title,
			description: suggestion.description,
			malId: suggestion.mal_id,
			priority: suggestion.priority,
			comment: suggestion.comment,
			image: suggestion.image,
			synopsis: suggestion.synopsis,
			type: suggestion.type,
			status: suggestion.status,
			reviewNote: suggestion.review_note,
			reviewedBy: suggestion.reviewed_by,
			createdAt: suggestion.created_at,
			updatedAt: suggestion.updated_at,
		}))
	}

	// Watch history methods
	async addToWatchHistory(
		userId: string,
		animeId: string,
		season: string,
		episode: string,
		progress: number,
	): Promise<void> {
		const entry = {
			user_id: userId,
			anime_id: animeId,
			season,
			episode,
			progress,
			timestamp: new Date().toISOString(),
		}

		const { error } = await supabase.from('watch_history').upsert(entry, {
			onConflict: 'user_id,anime_id,season,episode',
		})

		if (error) {
			console.error('Error saving watch history:', error)
			throw error
		}
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
		const query = supabase
			.from('watch_history')
			.select('*')
			.eq('userId', userId)
			.order('timestamp', { ascending: false })

		if (limit) {
			query.limit(limit)
		}

		const { data, error } = await query

		if (error) {
			console.error('Error fetching watch history:', error)
			return []
		}

		const history = await Promise.all(
			data.map(async (entry) => ({
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

		const favoriteAnime = user.favoriteAnime || []
		const isFavorite = !favoriteAnime.includes(animeId)

		const newFavorites =
			isFavorite ?
				[...favoriteAnime, animeId]
			:	favoriteAnime.filter((id) => id !== animeId)

		const { error } = await supabase
			.from('users')
			.update({ favorite_anime: newFavorites })
			.eq('id', userId)

		if (error) {
			console.error('Error toggling favorite:', error)
			throw error
		}

		return isFavorite
	}

	async isFavorite(userId: string, animeId: string): Promise<boolean> {
		const { data, error } = await supabase
			.from('users')
			.select('favorite_anime')
			.eq('id', userId)
			.single()

		if (error || !data) {
			return false
		}

		return data.favorite_anime?.includes(animeId) || false
	}

	async getAllUsers(): Promise<User[]> {
		const { data, error } = await supabase
			.from('users')
			.select('*')
			.order('last_login', { ascending: false })

		if (error) {
			console.error('Error fetching users:', error)
			return []
		}

		// Convert the data to match our User type
		return data.map((user) => ({
			id: user.id,
			username: user.username,
			discriminator: user.discriminator,
			avatar: user.avatar,
			email: user.email,
			accessToken: user.access_token,
			refreshToken: user.refresh_token,
			roles: user.roles,
			bio: user.bio,
			settings: user.settings,
			favoriteAnime: user.favorite_anime,
			createdAt: user.created_at,
			lastLogin: user.last_login,
		}))
	}

	async updateUserRoles(userId: string, roles: string[]): Promise<void> {
		const { error } = await supabase
			.from('users')
			.update({ roles })
			.eq('id', userId)

		if (error) {
			console.error('Error updating user roles:', error)
			throw error
		}
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
