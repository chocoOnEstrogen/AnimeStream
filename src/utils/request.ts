import { Request, Response } from 'express'
import * as constants from '../constants'
import { config } from '../config'
import { User } from '../types/user'
import { cache as botCache } from './discord'
import { supabase } from '../utils/supabase'

interface RenderData {
	title?: string
	[key: string]: any
}

export const render = async (
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

	// Get bot status directly from the shared cache
	const botData = botCache.get('botStatus') || {
		online: false,
		guildCount: 0,
		ping: 0,
		uptime: null
	}

	// Fetch active system alerts
	const { data: alerts } = await supabase
		.from('system_alerts')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(5)

	res.render(template, {
		...data,
		path,
		user,
		isAuthenticated,
		constants,
		config,
		flash: (req as any).flash,
		botStatus: botData,
		alerts: alerts || [],
		title: data.title ? `${data.title} - ${constants.APP_NAME}` : constants.APP_NAME,
	})
}
