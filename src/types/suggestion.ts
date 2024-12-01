export interface Suggestion {
	id: string
	userId: string
	malId: number
	title: string
	description: string
	synopsis: string
	image: string
	type: string
	status: 'pending' | 'approved' | 'rejected'
	priority: 'low' | 'medium' | 'high'
	comment?: string
	createdAt: string
	updatedAt: string
	reviewedBy?: string
	reviewNote?: string
}
