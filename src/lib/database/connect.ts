import Werror from '../errors'
import mongoose from 'mongoose'

export default async function connectToMongo(databaseUrl: string) {
	try {
		await mongoose.connect(databaseUrl)
	} catch (error) {
		throw new Werror(error, 'Connecting to MongoDB')
	}

	console.log('Mongoose is connected!')
}
