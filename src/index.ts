import dotenv from 'dotenv'
import Werror from './lib/errors'
import initBot from './bot/index'
import setWebhook from './server'
import connectToMongo from './lib/database/connect'

dotenv.config()

const token = process.env.BOT_TOKEN
if (!token) {
	throw new Werror('Bot token not specified')
}
const mongodbUrl = process.env.MONGODB
if (!mongodbUrl) {
	throw new Werror('Database connection url not specified')
}

void (async() => {
	try {
		await connectToMongo(mongodbUrl)
	} catch (error) {
		throw new Werror(error, 'Connecting to the database')
	}

	let bot
	try {
		bot = initBot(token)
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
