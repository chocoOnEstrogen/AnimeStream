import { Request, Response } from 'express'
import * as constants from '../constants'
import { config } from '../config'
import { User } from '../types/user'

interface RenderData {
	title?: string
	[key: string]: any
}

export const render = (
	req: Request,
	res: Response,
	template: string,
	data: RenderData = {},
) => {
	// Get the current path for active nav highlighting
	const path = req.path

	// Get user data from session
	const user = (req as any).user as User | undefined
	const isAuthenticated = (req as any).isAuthenticated as boolean

	if (!data.title) {
		data.title = constants.APP_NAME
	}

	res.render(template, {
		...data,
		path,
		user,
		isAuthenticated,
		constants,
		config,
		flash: (req as any).flash,
		title:
			data.title ? `${data.title} - ${constants.APP_NAME}` : constants.APP_NAME,
	})
}
