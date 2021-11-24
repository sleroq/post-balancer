import Werror from '../../lib/errors'

import { Router } from '@grammyjs/router'
import { SessionContext } from '..'

import { getAllChannels } from '../../lib/database/queries'

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
		
	}
	return ctx.session.conversation_state
})

newPostRouter.route('idle', async ctx => {
	if (!ctx.from || !ctx.message) return

	
})

export default newPostRouter