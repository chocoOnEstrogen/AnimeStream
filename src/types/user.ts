export interface User {
	id: string
	username: string
	discriminator: string
	avatar: string
	email?: string
	accessToken: string
	refreshToken: string
	roles: string[]
	createdAt: string
	lastLogin: string
	bio?: string
	favoriteAnime?: string[]
	watchHistory?: {
		animeId: string
		season: string
		episode: string
		timestamp: string
		progress: number
	}[]
	settings?: {
		theme: 'light' | 'dark'
		autoplay: boolean
		notifications: boolean
	}
}

export interface UserStore {
	[id: string]: User
}
