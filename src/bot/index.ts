import { Bot } from 'grammy'

export default async function initBot(token: string) {
	const bot = new Bot(token)

	bot.catch((error) => {
		console.error(error)
	})

	bot.on('message', (ctx) => ctx.reply('Hi there!'))

	return bot
}