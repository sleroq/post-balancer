import Werror from '../errors.js'

import UserModel, { User } from './models/user.model.js'
import ChannelModel, { Channel } from './models/channel.model.js'

import { Chat, User as TelegramUser } from '@grammyjs/types/manage'

export async function saveNewUser(user: TelegramUser): Promise<User> {
	let newUser
	try {
		newUser = await getUser(user.id)
	} catch (error) {
		throw new Werror('Getting user')
	}

	if (newUser) return newUser

	try {
		newUser = new UserModel({
			_id:           user.id,
			is_bot:        user.is_bot,
			username:      user.username,
			first_name:    user.first_name,
			last_name:     user.last_name,
			language_code: user.language_code,

			default_channel_settings: {
				max_posts_per_day:  8,
				min_posts_per_day:  3,
				max_posts_per_week: 60,
				min_posts_per_week: 40,
				consider_weekends:  true,
				consider_holidays:  true,
				best_time:          [{ since: '18:30', till: '22:00' }],
				sleep_time:         [{ since: '00:00', till: '6:00' }],
				timezone_offset:    3,
				add_buttons:        false,
			}
		})
	} catch (error) {
		throw new Werror(error, 'Creating model for a new user')
	}

	try {
		await newUser.save()
	} catch (error) {
		throw new Werror(error, 'Saving new user')
	}

	console.log('New user saved!')
	return newUser
}

export async function getUser(user_id: number): Promise<User | null> {
	let user
	try {
		user = await UserModel.findById(user_id)
	} catch (error) {
		throw new Werror('Getting user by id')
	}

	return user
}

export async function getAllChannels(user_id: number): Promise<Channel[] | null> {
	let channels
	try {
		channels = await ChannelModel.find({ owner_id: user_id })
	} catch (error) {
		throw new Werror('Getting channels by user id')
	}

	return channels
}

export async function saveNewChannel(
	chatInfo: Chat.ChannelGetChat | Chat.GroupGetChat | Chat.SupergroupGetChat,
	owner_id: number
) {
	let user
	try {
		user = await getUser(owner_id)
	} catch (error) {
		throw new Werror(error, 'Getting user to get default channel settings')
	}
	if (!user) throw new Werror('User is null!')

	let channel
	try {
		channel = new ChannelModel({
			_id:             chatInfo.id,
			owner_id:        owner_id,
			type:            chatInfo.type,
			title:           chatInfo.title,
			photo:           chatInfo.photo,
			description:     chatInfo.description,
			invite_link:     chatInfo.invite_link,

			settings:        user.default_channel_settings
		})
		if ('linked_chat_id' in chatInfo) channel.linked_chat_id = chatInfo.linked_chat_id
		if ('username' in chatInfo) channel.username = chatInfo.username
	} catch (error) {
		throw new Werror(error, 'Creating a model for new channel')
	}

	try {
		await channel.save()
	} catch (error) {
		throw new Werror(error, 'Saving new channel')
	}

	user.default_channel_id = chatInfo.id
	try {
		await user.save()
	} catch (error) {
		throw new Werror(error, 'Saving user')
	}
}