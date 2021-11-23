import Werror from '../../lib/errors'

import { SessionContext } from '..'
import { getAllChannels, saveNewUser } from '../../lib/database/queries'
import { InlineKeyboard } from 'grammy'


export default async function handleStart(ctx: SessionContext) {
	if (!ctx.from) return

	try {
		await saveNewUser(ctx.from)
	} catch (error) {
		throw new Werror(error, 'Saving user')
	}

	const inlineKeyboard = new InlineKeyboard()
		.text('Add channel', 'add_channel')

	let messageText
	try {
		messageText = await getStartText(ctx.from.id)
	} catch (error) {
		throw new Werror(error, 'Getting messageText for start command')
	}

	// Edit if from button, reply if from command
	if (ctx.callbackQuery) {
		try {
			await ctx.editMessageText(messageText, {
				reply_markup: inlineKeyboard
			})
		} catch (error) {
			throw new Werror(error, 'Editing start command')
		}
		// Reset conversation_state
		ctx.session.conversation_state = 'idle'
	} else {
		try {
			await ctx.reply(messageText, {
				reply_markup: inlineKeyboard
			})
		} catch (error) {
			throw new Werror(error, 'Replying on start command')
		}
	}
}

async function getStartText(userId: number): Promise<string> {
	let listOfChannels
	try {
		listOfChannels = await getChannelList(userId)
	} catch (error) {
		throw new Werror(error, 'Getting channel list for start message text')
	}

	if (listOfChannels)
		return `
Hello!
Your channels:
${listOfChannels}`
	else
		return `
Hello!
I can help you to schedule posts in your channel.
You can connect me to your channel(s) to schedule posts by pressing button below!`
}

async function getChannelList(userId: number): Promise<string | null> {
	let channels
	try {
		channels = await getAllChannels(userId)
	} catch (error) {
		throw new Werror('Getting all of user\'s channels')
	}
	if (!channels) return null

	let listOfChannels = ''
	channels.forEach(channel => {
		listOfChannels += ` - ${channel.title}\n`
	})

	return listOfChannels
}