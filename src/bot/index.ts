import { Bot, Context, session, SessionFlavor } from 'grammy'
import { parseMode } from '@grammyjs/parse-mode'

import { ChannelTypes } from '../lib/database/models/channel.model'

import handleStart from './handlers/start'

interface SessionData {
	conversation_state: 'idle' | 'waiting for forward from channel'
	channel_info?: {
		id:        number,
		title:     string,
		username?: string,
		type:      ChannelTypes,
	}
	message_to_edit?: number
}
export type SessionContext = Context & SessionFlavor<SessionData>;

export default function initBot(token: string) {
	const bot = new Bot<SessionContext>(token)

	bot.catch((error) => { console.error(error) })
	bot.api.config.use(parseMode('HTML'))

	bot.use(session({ initial: (): SessionData => ({ conversation_state: 'idle' }) }))

	// Commands:
	bot.command('start', async ctx => await handleStart(ctx))



	return bot
}
