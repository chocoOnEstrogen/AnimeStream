import { Request, Response, NextFunction } from 'express'
import { storage } from '../utils/storage'
import { User } from '../types/user'
import * as constants from '../constants'

declare global {
	namespace Express {
		interface Request {
			user?: User
			isAuthenticated: boolean
		}
	}
}

export async function authMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const userId = (req as any).session.userId

	if (userId) {
		const user = await storage.getUser(userId)
		if (user) {
			;(req as any).user = user
			;(req as any).isAuthenticated = true
			return next()
		}
	}

	;(req as any).user = undefined
	;(req as any).isAuthenticated = false
	next()
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	if (!(req as any).isAuthenticated) {
		return res.redirect('/auth/login')
	}
	next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
	if (
		!(req as any).isAuthenticated ||
		!(req as any).user?.roles.includes('admin')
	) {
		return res.status(403).render('error', {
			title: 'Access Denied',
			statusCode: 403,
			error: 'You do not have permission to access this page',
			constants,
		})
	}
	next()
}
