import { SessionContext } from '..'
import channelModel from '../../lib/database/models/channel.model'
import postModel from '../../lib/database/models/post.model'
import { getUser } from '../../lib/database/queries'
import Werror from '../../lib/errors'


export default async function handleSchedule(ctx: SessionContext) {
	if (!ctx.from) return

	let user
	try {
		user = await getUser(ctx.from.id)
	} catch (error) {
		throw new Werror(error, 'Getting user')
	}
	if (!user) return
	if (!user.default_channel_id) return

	let channel
	try {
		channel = await channelModel.findById(user.default_channel_id)
	} catch (error) {
		throw new Werror(error, 'Getting posts')
	}

	let posts
	try {
		posts = await postModel.find({
			channel_id: user.default_channel_id,
			owner_id: ctx.from.id,
			sent_date: { $gt: new Date() }
		})
	} catch (error) {
		throw new Werror(error, 'Getting posts')
	}

	if (!posts || !posts.length || !channel) {
		try {
			await ctx.reply('You have no posts scheduled yet')
		} catch (error) {
			throw new Werror(error, 'Replying no posts')
		}
		return
	}

	let messageText = `Schedule for <b>${channel.title}</b>`
	for (const post of posts) {
		messageText += `\n- ${post.messages.length} messages`
	}

	try {
		await ctx.reply(messageText)
	} catch (error) {
		throw new Werror(error, 'Replying with schedule')
	}
}