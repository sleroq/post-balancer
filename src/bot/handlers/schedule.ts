import { SessionContext } from '..'
import channelModel from '../../lib/database/models/channel.model'
import postModel from '../../lib/database/models/post.model'
import { getUser } from '../../lib/database/queries'
import Werror from '../../lib/errors'
import i18n from '../../lib/i18n'


export default async function handleSchedule(ctx: SessionContext) {
	if (!ctx.from) return

	const user = await getUser(ctx.from.id)

	if (!user) return
	if (!user.default_channel_id) return

	let channel
	try {
		channel = await channelModel.findById(user.default_channel_id)
	} catch (error) {
		throw new Werror(error, 'Getting channel')
	}

	let posts
	try {
		posts = await postModel.find({
			channel_id: user.default_channel_id,
			sent_date: { $gt: new Date() }
		})
	} catch (error) {
		throw new Werror(error, 'Getting posts')
	}

	if (!posts || !posts.length || !channel) {
		try {
			await ctx.reply(i18n.t('schedule.no_posts'))
		} catch (error) {
			throw new Werror(error, 'Replying no posts')
		}
		return
	}

	// TODO: escape html tags from channel title.
	let messageText = i18n.t('schedule.schedule_for', { channel_title: channel.title })
	for (const post of posts) {
		messageText += `\n- ${i18n.t('number_of_messages', { messages_length: post.messages.length })}`
	}

	try {
		await ctx.reply(messageText)
	} catch (error) {
		throw new Werror(error, 'Replying with schedule')
	}
}