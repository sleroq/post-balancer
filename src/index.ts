import dotenv from 'dotenv'
import Werror from './lib/errors'
import initBot from './bot/index'

dotenv.config()

const token = process.env.BOT_TOKEN
if (!token) {
	throw new Werror('Not bot token specified')
}

(async() => {
	await initBot(token)
})()