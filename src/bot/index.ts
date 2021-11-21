import { Bot, Context, session, SessionFlavor } from 'grammy'
import { parseMode } from '@grammyjs/parse-mode'

import handleStart from './handlers/start'

export default function initBot(token: string) {
	const bot = new Bot(token)

	bot.catch((error) => { console.error(error) })
	bot.api.config.use(parseMode('HTML'))


	// Commands:
	bot.command('start', async ctx => await handleStart(ctx))
	// bot.callbackQuery('back_to_start', async ctx => await handleStart(ctx))



	return bot
}
