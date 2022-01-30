import Werror from '../../lib/errors'

import { SessionContext } from '..'
import { saveNewUser } from '../../lib/database/queries'
import { getChannelList } from '../../lib/text-helpers'
import { InlineKeyboard } from 'grammy'

import i18n from '../../lib/i18n'

export default async function handleStart(ctx: SessionContext) {
	if (!ctx.from) return

	try {
		await saveNewUser(ctx.from)
	} catch (error) {
		throw new Werror(error, 'Saving user')
	}

	const inlineKeyboard = new InlineKeyboard()
		.text(i18n.t('buttons.add_channel'), 'add_channel')

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
		return i18n.t('start_message.not_first', { list: listOfChannels })
	else
		return i18n.t('start_message.first')
}