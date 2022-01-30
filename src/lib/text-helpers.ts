import { getAllChannels } from './database/queries'
import Werror from './errors'

export async function getChannelList(userId: number): Promise<string> {
	let channels
	try {
		channels = await getAllChannels(userId)
	} catch (error) {
		throw new Werror('Getting all of user\'s channels')
	}

	let listOfChannels = ''
	channels.forEach(channel => {
		listOfChannels += ` - ${channel.title}\n`
	})

	return listOfChannels
}