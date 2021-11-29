import channelModel, { Channel } from './database/models/channel.model'
import postModel from './database/models/post.model'
import { getUser } from './database/queries'
import Werror from './errors'
import { differenceInMilliseconds } from 'date-fns'

export default async function makeSchedule(userId?: number, channelId?: number) {
	if (!userId || !channelId) throw new Werror('Ether userId or channelId should be provided')
	if (!channelId) {
		let user
		try {
			user = await getUser(userId)
		} catch (error) {
			throw new Werror(error, 'Getting user')
		}
		if (!user) throw new Werror('Cant find this user in DB')
		if (!user.default_channel_id)
			throw new Werror('No channel id provided')
		channelId = user.default_channel_id
	}

	let channel
	try {
		channel = await channelModel.findById(channelId)
	} catch (error) {
		throw new Werror(error, 'Getting channel')
	}
	if (!channel) throw new Werror('Can\'t find this channel in DB')

	// Total scheduled posts
	let posts
	try {
		posts = await postModel.find({
			channel_id: channelId,
			sent_date: { $gt: new Date() }
		})
	} catch (error) {
		throw new Werror(error, 'Getting posts')
	}
	if (!posts || !posts.length) throw new Werror('There is no posts scheduled')

	let lastPost
	try {
		lastPost = await postModel.findOne({ channel_id: channelId }, {}, { sort: { sent_date: -1 } })
	} catch (error) {
		throw new Werror(error, 'Trying to get latest sent post')
	}
	if (!lastPost) throw new Werror('Idk, throw error for now')
	if (!lastPost.sent_date) throw new Werror('This is impossible or is it')

	let thisDate = new Date()
	let postsScheduled = 0

	while (posts.length != postsScheduled) {
		if (await sentThisWeek(thisDate, channelId) > channel.settings.max_posts_per_week) {
			thisDate = getNextMonday(thisDate)
			continue
		}
		if (await sentThisDay(thisDate, channelId) > channel.settings.max_posts_per_day) {
			thisDate = getNextDay(thisDate)
			continue
		}

		// const maxMsBetweenPosts = ((24 * 60 * 60 * 1000) / channel.settings.max_posts_per_day)
		// const msLeft = differenceInMilliseconds(lastPost.sent_date, getNextDay(thisDate))
		// if (msLeft < maxMsBetweenPosts) {
		// 	thisDate = getNextDay(thisDate)
		// 	continue
		// }

		const fti = getFirstTimeInterval(channel)

		console.log(fti)

		postsScheduled++
	}
}

interface TimeInterval {
	since: { hours: number, minutes: number }
	till:  { hours: number, minutes: number }
	duration: number
}

function getFirstTimeInterval(channel: Channel): TimeInterval {
	if (!channel.settings.sleep_time)
		return {
			since:    { hours: 0, minutes: 0 },
			till:     { hours: 24, minutes: 0 },
			duration: 24 * 60
		}

	const eAT: TimeInterval = {
		since:    { hours: NaN, minutes: NaN },
		till:     { hours: NaN, minutes: NaN },
		duration: NaN
	}

	for (const interval of channel.settings.sleep_time) {
		const hoursSince   = Number(interval.since.split(':')[0])
		const minutesSince = Number(interval.since.split(':')[1])

		if (hoursSince < eAT.since.hours)     eAT.since.hours   = hoursSince
		if (minutesSince < eAT.since.minutes) eAT.since.minutes = minutesSince
	}

	// TODO: check if this works:
	eAT.duration = (eAT.till.hours - eAT.since.hours) * 60 + +(eAT.till.minutes - eAT.since.minutes)

	return eAT
}

function getNextMonday(date: Date) {
	const day = date.getDay()

	date.setHours(0)
	date.setMinutes(0)
	date.setSeconds(0)
	date.setMilliseconds(0)

	if (day === 1) {
		date.setDate(date.getDate() + 7)
	} else if (day === 0) {
		date.setDate(date.getDate() + (7 - date.getDay() + 1))
	}
	return date
}

function getNextDay(date: Date): Date {
	date.setDate(date.getDate() + 1)

	date.setHours(0)
	date.setMinutes(0)
	date.setSeconds(0)
	date.setMilliseconds(0)

	return date
}

async function sentThisWeek(date: Date, channelId: number): Promise<number> {
	const previousMonday = getPreviousMonday(date)

	try {
		return await postModel.countDocuments({
			channel_id: channelId,
			sent_date: { $lt: date, $gt: previousMonday }
		})
	} catch (error) {
		throw new Werror(error, 'Counting documents for this week')
	}
}

async function sentThisDay(date: Date, channelId: number): Promise<number> {
	const startOfTheDay = date

	startOfTheDay.setHours(0)
	startOfTheDay.setMinutes(0)
	startOfTheDay.setSeconds(0)
	startOfTheDay.setMilliseconds(0)

	try {
		return await postModel.countDocuments({
			channel_id: channelId,
			sent_date: { $lt: date, $gt: startOfTheDay }
		})
	} catch (error) {
		throw new Werror(error, 'Counting documents for this week')
	}
}

function getPreviousMonday(date: Date): Date {
	const day = date.getDay()

	date.setHours(0)
	date.setMinutes(0)
	date.setSeconds(0)
	date.setMilliseconds(0)

	if (day === 1) {
		date.setDate(date.getDate() - 7)
	} else if (day === 0) {
		date.setDate(date.getDate() - 6)
	} else {
		date.setDate(date.getDate() - (date.getDay() - 1))
	}
	return date
}