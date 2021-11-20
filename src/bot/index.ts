import { Bot, Context } from 'grammy'
import { saveNewUser } from '../lib/database/queries'
import Werror from '../lib/errors'

export default function initBot(token: string) {
	const bot = new Bot(token)

	bot.catch((error) => { console.error(error) })

	bot.command('start', async ctx => await handleStart(ctx))
	bot.on('message', (ctx) => ctx.reply('Hi there!'))

	return bot
}

async function handleStart(ctx: Context) {
	if (!ctx.from) return

	try {
		await saveNewUser(ctx.from)
	} catch (error) {
		throw new Werror(error, 'Saving user')
	}

	await ctx.reply('Hi there!')
}