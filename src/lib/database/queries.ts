import Werror from '../errors.js'

import UserModel, { User } from './models/user.model.js'

import { User as TelegramUser } from '@grammyjs/types/manage'

export async function saveNewUser(user: TelegramUser): Promise<User> {
	let newUser
	try {
		newUser = await getUser(user.id)
	} catch (error) {
		throw new Werror('Getting user')
	}

	if (newUser) return newUser

	newUser = new UserModel({
		_id:           user.id,
		is_bot:        user.is_bot,
		username:      user.username,
		first_name:    user.first_name,
		last_name:     user.last_name,
		language_code: user.language_code,

		default_channel_settings: {}
	})

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