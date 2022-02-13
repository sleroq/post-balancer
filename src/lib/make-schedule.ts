import channelModel, { ChannelSettings, TimeIntervalSchema } from './database/models/channel.model'
import postModel, { Post } from './database/models/post.model'
import { getUser } from './database/queries'

import Werror from './errors'
import parentLogger from './logger'
const logger = parentLogger.child({
	module: 'make-schedule'
})

import { addDays, startOfDay, isAfter, differenceInMilliseconds, nextDay, differenceInDays, previousMonday, isBefore } from 'date-fns'

// This function thinks we are in London
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


	const now = new Date()
	const weekAgo = new Date(previousMonday(now).setUTCHours(0,0,0,0))

	let postedThisWeek: Post[] | undefined

	try {
		postedThisWeek = await postModel.find(
			{
				channel_id: channelId,
				sent_date: { $gt: weekAgo }
			},
			{},
			{ sort: { sent_date: -1 } })
	} catch (error) {
		throw new Werror(error, 'Getting posts for last week')
	}

	if (!postedThisWeek) postedThisWeek = []

	const postedToday = postedThisWeek.filter(post => {
		return Number(post.sent_date) > new Date(now.getTime()).setUTCHours(0, 0, 0, 0)
	})

	const lastPostSentDate = postedToday[postedToday.length - 1]?.sent_date || new Date('1/1/2020')

	logger.debug(`lastPostSentDate: ${String(lastPostSentDate)}`)
	logger.debug(`settings.max_posts_per_day: ${channel.settings.max_posts_per_day}`)

	// Schedule by iterating through weeks
	const weeksToSchedule = posts.length / channel.settings.max_posts_per_week
	const sleep_days = channel.settings.sleep_days || []
	let currentWeek = new Date(now.getTime())
	const max_per_week = channel.settings.max_posts_per_week
	const max_per_day = channel.settings.max_posts_per_day

	for (let i = 0; i < weeksToSchedule; i++) {

		// For 1st week
		if (i === 0 && postedThisWeek.length < max_per_week) {

			// We need to know if there any time left for the posts
			let freeDays = Math.abs(differenceInDays(currentWeek, nextDay(currentWeek, 1)))
			sleep_days.forEach(sd => {
				if (sd >= currentWeek.getDay())
					freeDays = freeDays - 1
			})

			if (freeDays > 1) {
				if (freeDays < 2 && channel.settings.sleep_time) {
					const intervals = channel.settings.sleep_time.map(interval => parseTimeIntervalToday(interval, currentWeek))

					let newDayFreeTime = 0
					freeTimeInNewDay(intervals, currentWeek).forEach((interval) => {
						newDayFreeTime += differenceInMilliseconds(interval.since, interval.till)
					})

					let freeTime = 0
					getFreeIntervals(intervals, currentWeek).forEach((interval) => {
						freeTime += differenceInMilliseconds(interval.since, interval.till)
					})

					const numberOfPosts = Math.round(freeTime / (newDayFreeTime / max_per_day))

					if (numberOfPosts > 0) {
						await scheduleForOneDay(currentWeek, channel.settings, posts.splice(0, numberOfPosts))
					}
				} else { // TODO: tests tests teests TESTSTS
					const numberOfPosts = max_per_day * freeDays

					await scheduleForOneDay(currentWeek, channel.settings, posts.splice(0, numberOfPosts))
				}
			}

			currentWeek = nextDay(currentWeek, 1)
			continue
		}

		await scheduleForOneWeek(posts.splice(0, max_per_week), channel.settings, currentWeek)

		// Next week
		currentWeek = getStartOfNextWeek(currentWeek)
	}
}

async function scheduleForOneWeek(posts: Post[], settings: ChannelSettings, startOfWeek: Date) {
	const daysToSchedule = Math.abs(differenceInDays(startOfWeek, nextDay(startOfWeek, 0))) - (settings.sleep_days?.length || 0)
	const max_per_day = settings.max_posts_per_day

	let currentDay = new Date(startOfWeek)
	for (let i = 0; i < daysToSchedule; i++) {
		if (posts.length < max_per_day * 2) {
			await scheduleForOneDay(currentDay, settings, posts.splice(0, max_per_day))
		} else {
			const numOfPostsToSchedule = Math.ceil(posts.length / daysToSchedule)
			await scheduleForOneDay(currentDay, settings, posts.splice(0, numOfPostsToSchedule))
		}

		currentDay = getStartOfNextDay(currentDay)
	}
}

async function scheduleForOneDay(now: Date, settings: ChannelSettings, posts: Post[]) {
	const sleepTime = settings.sleep_time || []

	const intervals = sleepTime.map(interval => parseTimeIntervalToday(interval, now))

	// Sort intervals by time; TODO: do this when adding intervals
	intervals.sort((first, second) => first.till.getTime() - second.since.getTime())

	// TODO: Fix overlaping intervals
	// TODO: Fix intervals like this 23:00 - 1:00

	logger.debug({ sleepTime: sleepTime }, 'Raw intervals')
	logger.debug({ intervals: intervals }, 'Parsed intervals')

	// Get available interavels

	const freeIntervals = getFreeIntervals(intervals, now)

	// TODO: Filter too short intervals

	let freeTime = 0 // ms
	freeIntervals.forEach((interval) => {
		freeTime += differenceInMilliseconds(interval.till, interval.since)
	})

	logger.debug(`freeTime: ${freeTime / 1000 / 60 / 60}`)

	/*
		TODO: add preferred time intervals
		somehow find preferred intervals inside available intervals then do same as for available but
		try to increase "really available time" n times to fit more posts and then decrease n times

		Have to write function that finds overlaps between intervals
		Find overlaps between preffered and availible
		Probably split free intervals to specify preffered time
	*/
	for (const interval of freeIntervals) {
		const availWithoutGapsMs = differenceInMilliseconds(interval.till, interval.since)

		const postGlovalInterval = freeTime / posts.length
		// If does not work go with ceil
		const postsToFit = Math.round(availWithoutGapsMs / postGlovalInterval)

		const gap = availWithoutGapsMs / postsToFit / 2
		const available = availWithoutGapsMs - gap * 2

		const postInterval = available / postsToFit

		let lastScheduledDateMs = interval.since.getTime()

		for (const post of posts) {
			let finalDate
			if (posts.indexOf(post) === 0) {
				finalDate = lastScheduledDateMs + gap
			} else {
				finalDate = lastScheduledDateMs + postInterval
			}

			// TODO: set scheduled date for messages?
			post.scheduled_sent_date = new Date(finalDate)
			await post.save()

			lastScheduledDateMs = finalDate
		}
	}
}

/*
 * Get inverse intervals from now till end of the day
 *
 * @param now - date for from which intervals will be taken into account
 *
 * @param sleepIntevals - parsedInterval without overlaps,
 *                        with time within day of given date
 *
 * example:
 *     input:  [{ since: new Date('2/1/22 2:00'), till: new Date('2/1/22 10:00')}], new Date('2/1/22 1:00')
 *     output: [
 *         { since: 2022-02-01T01:00:00.000Z, till: 2022-02-01T02:00:00.000Z },
 *         { since: 2022-02-01T10:00:00.000Z, till: 2022-02-02T00:00:00.000Z }
 *     ]
 */
export function getFreeIntervals(sleepIntervals: parsedInterval[], now: Date) {
	if (!sleepIntervals.length) return [
		{ since: startOfDay(now), till: startOfDay(addDays(now, 1)) }
	]

	const freeIntervals: parsedInterval[] = []

	sleepIntervals.forEach((current, index) => {
		const previous = sleepIntervals[index - 1] || { since: startOfDay(now), till: startOfDay(now) }
		const next = sleepIntervals[index + 1] || { since: startOfDay(addDays(now, 1)), till: startOfDay(addDays(now, 1)) }

		// TODO: Simplify
		if (isAfter(now, current.till))
			return

		if (isAfter(now, current.since))
			return

		if (isBefore(now, previous.till)) {
			freeIntervals.push({ since: previous.till, till: current.since })
		} else {
			freeIntervals.push({ since: now, till: current.since })
			if (index === sleepIntervals.length - 1) {
				freeIntervals.push({ since: current.till, till: next.since })
			}
			return
		}

		freeIntervals.push({ since: current.till, till: next.since })
	})

	return freeIntervals
}
export interface parsedInterval {
	since: Date,
	till: Date
}

function parseTimeIntervalToday(interval: TimeIntervalSchema, now: Date | number): parsedInterval {
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

function freeTimeInNewDay(intervals: parsedInterval[], date: Date) {
	const dayStart = new Date(date.getTime()).setUTCHours(0, 0, 0, 0)
	return getFreeIntervals(intervals, new Date(dayStart))
}

function getStartOfNextWeek (date: Date): Date {
	return new Date(nextDay(date, 1).setUTCHours(0, 0, 0, 0))
}

function getStartOfNextDay(date: Date): Date {
	const newDate = new Date(Number(date))
	newDate.setUTCDate(date.getDate() + 1)
	newDate.setUTCHours(0, 0, 0, 0)
	return newDate
}