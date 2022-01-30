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
			sent_date: undefined
			// scheduled_sent_date: { $gt: new Date() }
		})
	} catch (error) {
		throw new Werror(error, 'Getting scheduled posts')
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
	let messageText = i18n.t('schedule.schedule_for', { channel_title: channel.title, link: channel.username })
	for (const post of posts) {
		const scheduledDate = post.scheduled_sent_date
			? i18n.t('full_date', {
				month: post.scheduled_sent_date.getUTCMonth(),
				day: post.scheduled_sent_date.getUTCDate(),
				year: post.scheduled_sent_date.getUTCFullYear(),
				hours: post.scheduled_sent_date.getUTCHours(),
				minutes: post.scheduled_sent_date.getUTCMinutes()
			})
			: 'not scheduled'
		messageText += `\n- <code>${scheduledDate}</code> - ${i18n.t('schedule.number_of_messages', { messages_length: post.messages.length })}`
	}

	try {
		await ctx.reply(messageText)
	} catch (error) {
		throw new Werror(error, 'Replying with schedule')
	}
}