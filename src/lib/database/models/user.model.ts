import { Schema, model, Document } from 'mongoose'
import { ChannelSettings, channelSettingsSchema } from './channel.model'

export interface UserSchema {
	_id:           string
	is_bot:        boolean
	username?:     string
	first_name?:   string
	last_name?:    string
	language_code: string

	conversation_state?: string
	default_channel_settings: ChannelSettings

	createdAt:     Date
	updatedAt:     Date
}
const userSchema = new Schema({
	_id:           { type: Number, required: true },
	is_bot:        { type: Boolean, required: true },
	username:      String,
	first_name:    String,
	last_name:     String,
	language_code: { type: String, default: 'en' },

	conversation_state: String,
	default_channel_settings: { type: channelSettingsSchema, required: true },
}, { timestamps: true })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type User = UserSchema & Document<any, any, UserSchema>
export default model<UserSchema>('User', userSchema)