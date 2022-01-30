import Werror from '../../lib/errors'

import { Router } from '@grammyjs/router'
import { SessionContext } from '..'
import { GrammyError, InlineKeyboard } from 'grammy'
import { Chat, ChatFromGetChat } from '@grammyjs/types'

import { saveNewChannel } from '../../lib/database/queries'
import { getChannelList } from '../../lib/text-helpers'
import handleStart from '../handlers/start'
import logger from '../../lib/logger'

import i18n from '../../lib/i18n'

const newChannelRouter = new Router<SessionContext>(async ctx => {
	if (ctx.callbackQuery) {
		// answerCallbackQuery() is needed to prevent infinite loading
		try {
			await ctx.answerCallbackQuery()
		} catch (error) {
			logger.warn(`Error, answering callback query: ${String(error)}`)
		}
		switch (ctx.callbackQuery.data) {
		case 'add_channel':
			await handleAddChannelButton(ctx)
			break
		case 'back_to_start':
			await handleStart(ctx)
			break
		}
	}
	return ctx.session.conversation_state
})

newChannelRouter.route('waiting for forward from channel', async (ctx) => {
	if (!ctx.message?.forward_from_chat) return // Todo: add some helpful reply
	if (!ctx.session.message_to_edit) throw new Werror('Dnno what to edit!')
	if (!ctx.from) throw new Werror('Dnno who sent message')

	const chatInfoFromForward = ctx.message.forward_from_chat

	let chatInfo
	try {
		chatInfo = await ctx.api.getChat(chatInfoFromForward.id)
	} catch (error) {
		throw new Werror(error, 'Getting channel info')
	}

	if (chatInfo.type !== 'channel') {
		try {
			await ctx.reply(i18n.t('add_channel.channels_only'))
		} catch (error) {
			throw new Werror(error, 'Replying bot work only with channels')
		}
		return
	}

	let botHaveRight
	try {
		botHaveRight = await checkRights(ctx, chatInfo)
	} catch (error) {
		throw new Werror(error, 'Checking bot\'s rights in channel')
	}

	if (!botHaveRight) {
		await replyGiveMeRights(ctx)
	} else {
		await saveAndFinish(ctx, chatInfo, ctx.from.id)
		ctx.session.conversation_state = 'idle'
	}
})

export default newChannelRouter

export async function handleAddChannelButton(ctx: SessionContext) {
	const inlineKeyboard = new InlineKeyboard()
		.text(i18n.t('buttons.cancel'), 'back_to_start')

	let sentMessage
	try {
		sentMessage = await ctx.editMessageText(i18n.t('add_channel.instructions'), {
			reply_markup: inlineKeyboard
		})
	} catch (error) {
		throw new Werror(error, 'Replying on start command')
	}

	if (sentMessage === true) throw new Werror('/start message cannot be inline')

	ctx.session.message_to_edit = sentMessage.message_id
	ctx.session.conversation_state = 'waiting for forward from channel'
}

async function replyGiveMeRights(ctx: SessionContext) {
	const inlineKeyboard = new InlineKeyboard()
		.text(i18n.t('buttons.cancel'), 'back_to_start')

	try {
		await ctx.reply(
			i18n.t('add_channel.no_rights'),
			{ reply_markup: inlineKeyboard }
		)
	} catch (error) {
		throw new Werror(error, 'Replying after getting channel_id')
	}
}

async function saveAndFinish(
	ctx: SessionContext,
	chatInfo: Chat.ChannelGetChat | Chat.GroupGetChat | Chat.SupergroupGetChat,
	userId: number
) {
	try {
		await saveNewChannel(chatInfo, userId)
	} catch (error) {
		if (error instanceof Error && error.message.includes('E11000 duplicate key error collection')) {
			try {
				await ctx.reply(i18n.t('add_channel.already_added'))
			} catch (e) {
				throw new Werror(e, 'Replying channel already added')
			}
			return
		}

		const wrappedError = new Werror(error, 'Saving new Channel')
		try {
			await ctx.reply(i18n.t('unknown_error'))
		} catch (e) {
			throw new Werror(wrappedError, 'Replying sorry')
		}

		throw wrappedError
	}

	try {
		let listOfChannels
		try {
			listOfChannels = await getChannelList(userId)
		} catch (error) {
			throw new Werror(error, 'Getting channel list')
		}

		const messageText = i18n.t('add_channel.done', { list: listOfChannels })

		await ctx.reply(messageText)
	} catch (error) {
		throw new Werror(error, 'Replying after saving new channel')
	}
}

async function checkRights(ctx: SessionContext, chatInfo: ChatFromGetChat) {
	let messageToDelete
	try {
		messageToDelete = await ctx.api.sendMessage(
			chatInfo.id,
			'Test message, don\'t worry!',
			{ disable_notification: true }
		)
	} catch (error) {
		if (error instanceof GrammyError && error.error_code === 403) {
			return false
		}

		throw new Werror(error, 'Sending message to channel')
	}

	try {
		await ctx.api.deleteMessage(
			chatInfo.id,
			messageToDelete.message_id
		)
	} catch (error) {
		if (error instanceof GrammyError && error.error_code === 403) {
			return false
		}

		throw new Werror(error, 'Deleting message in channel')
	}

	return true
}