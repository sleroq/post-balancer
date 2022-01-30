import channelModel, { ChannelSettings, TimeIntervalSchema } from './database/models/channel.model'
import postModel, { Post } from './database/models/post.model'
import { getUser } from './database/queries'

import Werror from './errors'
import parentLogger from './logger'
const logger = parentLogger.child({
	module: 'make-schedule'
})
// import { differenceInMilliseconds } from 'date-fns'

export default async function makeSchedule(userId?: number, channelId?: number) {
	if (!userId && !channelId) throw new Werror('Either userId or channelId should be provided')
	if (!channelId && userId) {
		const user = await getUser(userId)
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
			sent_date: undefined
		})
	} catch (error) {
		throw new Werror(error, 'Getting posts')
	}
	if (!posts || !posts.length) throw new Werror('There is no posts to schedule')

	logger.debug(`posts.length: ${posts.length}`)

	// Get date of last post:
	let lastPostSentDate: Date
	let lastPost
	try {
		lastPost = await postModel.findOne({ channel_id: channelId }, {}, { sort: { sent_date: -1 } })
	} catch (error) {
		throw new Werror(error, 'Trying to get latest sent post')
	}
	if (!lastPost) lastPostSentDate = new Date(Number(new Date()) - 1000 * 100000 * 100) // Long time ago
	else lastPostSentDate = lastPost.sent_date || new Date(Number(new Date()) - 1000 * 100000 * 100)

	logger.debug(`lastPostSentDate: ${String(lastPostSentDate)}`)
	logger.debug(`channel.settings.max_posts_per_day: ${channel.settings.max_posts_per_day}`)

	let now = new Date()

	// If posts less then in one day - schedule for one day
	// TODO: check how many already posted today and what percent of avalible time is left
	if (posts.length < channel.settings.max_posts_per_day) {
		logger.debug('creating a schedule only for one day')

		while (channel.settings.sleep_days
			&& channel.settings.sleep_days.includes(now.getDay())) {
			now = getNextDay(now)
		}
		await scheduleForOneDay(now, lastPostSentDate, channel.settings, posts)
	} else {
		throw new Werror('Can\'t do this yet')
		// if (posts.length > channel.settings.max_posts_per_week) {
		// 	posts = posts.slice(0, channel.settings.max_posts_per_week)
		// }
	}

	// while (posts.length != postsScheduled) {
	// 	if (await sentThisWeek(thisDate, channelId) > channel.settings.max_posts_per_week) {
	// 		thisDate = getNextMonday(thisDate)
	// 		continue
	// 	}
	// 	if (await sentThisDay(thisDate, channelId) > channel.settings.max_posts_per_day) {
	// 		thisDate = getNextDay(thisDate)
	// 		continue
	// 	}

	// 	// const maxMsBetweenPosts = ((24 * 60 * 60 * 1000) / channel.settings.max_posts_per_day)
	// 	// const msLeft = differenceInMilliseconds(lastPost.sent_date, getNextDay(thisDate))
	// 	// if (msLeft < maxMsBetweenPosts) {
	// 	// 	thisDate = getNextDay(thisDate)
	// 	// 	continue
	// 	// }

	// 	const fti = getFirstTimeInterval(channel)

	// 	console.log(fti)

	// 	postsScheduled++
	// }
}

async function scheduleForOneDay(now: Date, lastPostSentDate: Date, settings: ChannelSettings, posts: Post[]) {
	// Get really available time:

	const sleepTime = settings.sleep_time || []

	const intervals = sleepTime.map(interval => parseTimeIntervalToday(interval, now))

	logger.debug({ sleepTime }, 'Raw intervals')
	logger.debug({ intervals }, 'Parsed intervals')

	// Sort intervals by time; TODO: do this when adding intervals
	intervals.sort((first, second) => Number(first.till) - Number(second.since))

	// Get available interavels

	let availibleRough = 0 // in ms
	let availibleReal = 0  // in ms
	const availIntvls: parsedInterval[] = []

	intervals.forEach((interval, index) => {
		const nextInterval = intervals[index + 1]

		logger.debug({ interval }, 'first interval')
		logger.debug({ nextInterval }, 'nextInterval')
		// Skip past intervals
		if (nextInterval && Number(nextInterval.since) < Number(now)) {
			logger.debug({ interval, nextInterval }, 'skip!')
			return
		}

		if (index === 0 && Number(now) < Number(interval.since)) {
			const availTimeMs = Number(interval.since) - Number(now)
			logger.debug('add ' + String(availTimeMs / 1000 / 60))
			availibleRough += availTimeMs
		}

		if (nextInterval) {
			const nextSince = Number(now) > Number(nextInterval.since) ? now : nextInterval.since
			const availTimeMs = Number(nextSince) - Number(interval.till)
			logger.debug('add ' + String(availTimeMs / 1000 / 60))
			availibleRough += availTimeMs
		} else {
			const endOfTheDay = new Date(Number(now))
			endOfTheDay.setUTCHours(23, 59, 59, 999)

			const availTimeMs = Number(endOfTheDay) - Number(interval.till)
			logger.debug('add ' + String(availTimeMs / 1000 / 60))
			availibleRough += availTimeMs
		}
	})

	logger.debug(`availibleRough: ${availibleRough / 1000 / 60}`)

	// Incase availible interval is too small
	intervals.forEach((interval, index) => {
		const nextInterval = intervals[index + 1]

		// Skip past intervals
		if (nextInterval && (Number(nextInterval.since) < Number(now))) return

		if (index === 0 && Number(now) < Number(interval.since)) {
			const availTimeMs = Number(interval.since) - Number(now)
			if (availTimeMs > (availibleRough / posts.length) / 4) {
				availIntvls.push({
					since: now,
					till: interval.since
				})
				availibleReal += availTimeMs
			}
		}

		if (nextInterval) {
			const nextSince = Number(now) > Number(nextInterval.since) ? now : nextInterval.since
			const availTimeMs = Number(nextSince) - Number(interval.till)

			if (availTimeMs > (availibleRough / posts.length) / 4) {
				availIntvls.push({
					since: interval.till,
					till: nextSince
				})
				availibleReal += availTimeMs
			}
		} else {
			const endOfTheDay = new Date(Number(now))
			endOfTheDay.setUTCHours(23, 59, 59, 999)

			const availTimeMs = Number(endOfTheDay) - Number(interval.till)
			if (availTimeMs > (availibleRough / posts.length) / 4) {
				availIntvls.push({
					since: interval.till,
					till: endOfTheDay
				})
				availibleReal += availTimeMs
			}
		}
	})

	logger.debug(`availibleReal: ${availibleReal / 1000 / 60}`)
	logger.debug({availIntvls}, 'Available intervals')

	/*
		TODO: add preferred time intervals
		somehow find preferred intervals inside available intervals then do same as for available but
		try to increase "really available time" n times to fit more posts and then decrease n times
	*/
	for (const interval of availIntvls) {
		const availWithoutGapsMs = Number(interval.till) - Number(interval.since)

		const postGlovalInterval = availibleReal / posts.length
		// If does not work go with ceil
		const postsToFit = Math.round(availWithoutGapsMs / postGlovalInterval)

		const gap = availWithoutGapsMs / postsToFit / 2
		const available = availWithoutGapsMs - gap * 2

		const postInterval = available / postsToFit

		let lastScheduledDate = interval.since

		for (const post of posts) {
			let finalDate
			if (posts.indexOf(post) === 0) {
				finalDate = new Date(Number(lastScheduledDate) + gap)
			} else {
				finalDate = new Date(Number(lastScheduledDate) + postInterval)
			}

			// TODO: set scheduled date for messages?
			post.scheduled_sent_date = finalDate
			await post.save()

			lastScheduledDate = finalDate
		}
	}
}

interface parsedInterval {
	since: Date,
	till: Date
}

function parseTimeIntervalToday(interval: TimeIntervalSchema, now: Date): parsedInterval {
	const dateSince = new Date(Number(now))

	dateSince.setUTCHours(
		Number(interval.since.split(':')[0]),
		Number(interval.since.split(':')[1]),
		0,
		0
	)

	const dateTill = new Date(Number(now))
	dateTill.setUTCHours(
		Number(interval.till.split(':')[0]),
		Number(interval.till.split(':')[1]),
		0,
		0
	)

	return { since: dateSince, till: dateTill }
}

// interface TimeInterval {
// 	since: { hours: number, minutes: number }
// 	till: { hours: number, minutes: number }
// 	duration: number
// }

// function getFirstTimeInterval(channel: Channel): TimeInterval {
// 	if (!channel.settings.sleep_time)
// 		return {
// 			since: { hours: 0, minutes: 0 },
// 			till: { hours: 24, minutes: 0 },
// 			duration: 24 * 60
// 		}

// 	const eAT: TimeInterval = {
// 		since: { hours: NaN, minutes: NaN },
// 		till: { hours: NaN, minutes: NaN },
// 		duration: NaN
// 	}

// 	for (const interval of channel.settings.sleep_time) {
// 		const hoursSince = Number(interval.since.split(':')[0])
// 		const minutesSince = Number(interval.since.split(':')[1])

// 		if (hoursSince < eAT.since.hours) eAT.since.hours = hoursSince
// 		if (minutesSince < eAT.since.minutes) eAT.since.minutes = minutesSince
// 	}

// 	// TODO: check if this works:
// 	eAT.duration = (eAT.till.hours - eAT.since.hours) * 60 + +(eAT.till.minutes - eAT.since.minutes)

// 	return eAT
// }

// function getNextMonday(date: Date) {
// 	const day = date.getDay()

// 	date.setHours(0) // WARN UTC
// 	date.setMinutes(0)
// 	date.setSeconds(0)
// 	date.setMilliseconds(0)

// 	if (day === 1) {
// 		date.setDate(date.getDate() + 7)
// 	} else if (day === 0) {
// 		date.setDate(date.getDate() + (7 - date.getDay() + 1))
// 	}
// 	return date
// }

function getNextDay(date: Date): Date {
	const newDate = new Date(Number(date))
	newDate.setUTCDate(date.getDate() + 1)
	newDate.setUTCHours(0, 0, 0, 0)
	return newDate
}

// async function sentThisWeek(date: Date, channelId: number): Promise<number> {
// 	const previousMonday = getPreviousMonday(date)

// 	try {
// 		return await postModel.countDocuments({
// 			channel_id: channelId,
// 			sent_date: { $lt: date, $gt: previousMonday }
// 		})
// 	} catch (error) {
// 		throw new Werror(error, 'Counting documents for this week')
// 	}
// }

// async function sentThisDay(date: Date, channelId: number): Promise<number> {
// 	const startOfTheDay = date

// 	startOfTheDay.setHours(0) // WARN UTC
// 	startOfTheDay.setMinutes(0)
// 	startOfTheDay.setSeconds(0)
// 	startOfTheDay.setMilliseconds(0)

// 	try {
// 		return await postModel.countDocuments({
// 			channel_id: channelId,
// 			sent_date: { $lt: date, $gt: startOfTheDay }
// 		})
// 	} catch (error) {
// 		throw new Werror(error, 'Counting documents for this week')
// 	}
// }

// function getPreviousMonday(date: Date): Date {
// 	const day = date.getDay()

// 	date.setHours(0) // WARN UTC
// 	date.setMinutes(0)
// 	date.setSeconds(0)
// 	date.setMilliseconds(0)

// 	if (day === 1) {
// 		date.setDate(date.getDate() - 7)
// 	} else if (day === 0) {
// 		date.setDate(date.getDate() - 6)
// 	} else {
// 		date.setDate(date.getDate() - (date.getDay() - 1))
// 	}
// 	return date
// }