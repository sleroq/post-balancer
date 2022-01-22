import Werror from '../../lib/errors'

import { Router } from '@grammyjs/router'
import { SessionContext } from '..'

import { getAllChannels, saveNewMessage } from '../../lib/database/queries'
import makeSchedule from '../../lib/make-schedule'

const newPostRouter = new Router<SessionContext>(async ctx => {
	if (!ctx.from || !ctx.message) return
	let channels
	try {
		channels = await getAllChannels(ctx.from.id)
	} catch (error) {
		throw new Werror('Getting all of user\'s channels')
	}
	if (!channels) return

	if (ctx.message.text === '/done') {
		if (!ctx.session.unsent_post_id) return

		ctx.session.unsent_post_id = undefined
		try {
			await ctx.reply('Ok! Post is saved')
		} catch (error) {
			throw new Werror(error, 'Replying that post is done')
		}

		try {
			await makeSchedule(ctx.from.id)
		} catch (error) {
			throw new Werror(error, 'Creating a schedule')
		}

		try {
			await ctx.reply('Schedule rescheduled or something')
		} catch (error) {
			throw new Werror(error, 'Replying that post is done')
		}

		return
	}
	return ctx.session.conversation_state
})

newPostRouter.route('idle', async ctx => {
	if (!ctx.from || !ctx.message) return

	let post_id
	try {
		post_id = await saveNewMessage(ctx.message, ctx.from.id, ctx.session.unsent_post_id)
	} catch (error) {
		throw new Werror(error, 'Saving new message')
	}
	ctx.session.unsent_post_id = post_id

	try {
		await ctx.reply('Message is added to new post.\nSend /done when post is ready.')
	} catch (error) {
		throw new Werror(error, 'Replying that message is saved')
	}
})

export default newPostRouter
