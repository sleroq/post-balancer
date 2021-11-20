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
		console.log('Webhook is set')
	} else {
		console.log('Url for not specified, starting polling')
		void bot.start({
			drop_pending_updates: true
		})
	}
})()

function getUrlForWebhook() {
	if (process.env.HEROKU_APP_NAME) {
		return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`
	} else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
		return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER.toLowerCase()}.repl.co`
	}
	return undefined
}
