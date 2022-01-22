import { Bot, Context, session, SessionFlavor } from 'grammy'
import { parseMode } from '@grammyjs/parse-mode'

import { ChannelTypes } from '../lib/database/models/channel.model'

import handleStart from './handlers/start'
import newChannelRouter from './actions/add-new-channel'
import newPostRouter from './actions/add-new-post'
import handleSchedule from './handlers/schedule'

interface SessionData {
	conversation_state: 'idle' | 'waiting for forward from channel'
	channel_info?: {
		id:        number,
		title:     string,
		username?: string,
		type:      ChannelTypes,
	}
	unsent_post_id?: string,
	message_to_edit?: number
}

export type SessionContext = Context & SessionFlavor<SessionData>;

export default function initBot(token: string) {
	const bot = new Bot<SessionContext>(token)

	// TODO: log errors
	bot.catch((error) => { console.error(error) })
	bot.api.config.use(parseMode('HTML'))

	bot.use(session({ initial: (): SessionData => ({ conversation_state: 'idle' }) }))

	// Commands:
	bot.command('start', async ctx => await handleStart(ctx))

	bot.command('posts', async ctx => await handleSchedule(ctx))
	bot.command('schedule', async ctx => await handleSchedule(ctx))

	// Routers:
	bot.use(newChannelRouter)
	bot.use(newPostRouter)

	return bot
}
