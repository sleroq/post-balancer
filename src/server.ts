import express from 'express'
import { Bot, webhookCallback } from 'grammy'
import { SessionContext } from './bot'

export default async function setWebhook(bot: Bot<SessionContext>, urlForWebhook: string): Promise<void> {
	const server = express()
	server.use(express.json())

	// 3. Register a handler for the bot
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	server.post('/webhook', webhookCallback(bot, 'express'))

	server.listen(80)

	const webhookURL = new URL('/webhook', urlForWebhook)

	// 4. Set webhook for handler in Bot API
	await bot.api.setWebhook(webhookURL.toString(), {
		drop_pending_updates: true
	})
}