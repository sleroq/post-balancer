import dotenv from 'dotenv'
import Werror from './lib/errors'
import initBot from './bot/index'
import setWebhook from './server'

dotenv.config()

const token = process.env.BOT_TOKEN
if (!token) {
	throw new Werror('Not bot token specified')
}

void (async() => {
	let bot
	try {
		bot = await initBot(token)
	} catch (error) {
		throw new Werror(error, 'Initializing the bot')
	}
	
	const urlForWebhook = getUrlForWebhook()
	if (urlForWebhook) {
		try {
			await setWebhook(bot, urlForWebhook)
		} catch (error) {
			throw new Werror(error, 'Starting with webhook')
		}
	} else {
		await bot.start({
			drop_pending_updates: true
		})
	}

})()

function getUrlForWebhook(): string | null {
	throw new Error('Function not implemented.')
}
