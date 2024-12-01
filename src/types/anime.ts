export interface Episode {
	id: string
	number: number
	title: string
	path: string
	thumbnail?: string
	duration?: number
}

export interface Anime {
	id: string
	title: string
	description: string
	type: 'TV' | 'Movie' | 'OVA' | 'Special'
	genre: string[]
	episodes: Episode[]
	cover?: string
	banner?: string
	year?: number
	season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'
	status: 'FINISHED' | 'ONGOING' | 'UPCOMING'
	rating?: number
	malId?: number
	addedAt: string
	updatedAt: string
}
