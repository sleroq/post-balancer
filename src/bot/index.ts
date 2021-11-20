import { Bot } from 'grammy'

export default async function initBot(token: string) {
	const bot = new Bot(token)

	bot.on('message', (ctx) => ctx.reply('Hi there!'))

	return bot
}