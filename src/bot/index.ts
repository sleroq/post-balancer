import Werror from '../lib/errors'

import { Bot, Context, InlineKeyboard } from 'grammy'
import { parseMode } from '@grammyjs/parse-mode'

import { getAllChannels, saveNewUser } from '../lib/database/queries'

export default function initBot(token: string) {
	const bot = new Bot(token)

	bot.catch((error) => { console.error(error) })

	bot.api.config.use(parseMode('HTML'))

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

	let channels
	try {
		channels = await getAllChannels(ctx.from.id)
	} catch (error) {
		throw new Werror('Getting all of user\'s channels')
	}

	let messageText = ''

	if (channels && channels.length) {
		let listOfChannels = ''
		channels.forEach(channel => {
			listOfChannels += `\n- ${channel.title}`
		})

		messageText = `
Hello!
You have ${channels.length} channels:${listOfChannels}`
	} else {
		messageText = `
Hello!
You can connect bot to your channel(s) to schedule posts by pressing button below!`
	}

	const inlineKeyboard = new InlineKeyboard()
		.text('Add channel')
	try {
		await ctx.reply(messageText, {
			reply_markup: inlineKeyboard
		})
	} catch (error) {
		throw new Werror(error, 'Replying on start command')
	}
}