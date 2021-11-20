import { Schema, model, Document } from 'mongoose'
import { ChatPhoto } from '@grammyjs/types/manage'

interface TimeIntervalSchema {
	since: string
	till:  string
}

const timeIntervalSchema = new Schema({
	since: { type: String, required: true },
	till:  { type: String, required: true },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TimeInterval = TimeIntervalSchema & Document<any, any, TimeIntervalSchema>

interface ChannelSettingsSchema {
	max_posts_per_day?:  number
	min_posts_per_day?:  number
	max_posts_per_week?: number
	min_posts_per_week?: number
	consider_weekends?:  boolean
	consider_holidays?:  boolean
	best_time?:          TimeIntervalSchema
	best_days?:          string[]
	sleep_time?:         TimeIntervalSchema
	sleep_days?:         string[]
	timezone_offset?:    number
	add_buttons?:        boolean
}

export const channelSettingsSchema = new Schema({
	max_posts_per_day:  Number,
	min_posts_per_day:  Number,
	max_posts_per_week: Number,
	min_posts_per_week: Number,
	consider_weekends:  Boolean,
	consider_holidays:  Boolean,
	best_time:          timeIntervalSchema,
	best_days:          [String],
	sleep_time:         timeIntervalSchema,
	sleep_days:         [String],
	timezone_offset:    Number,
	add_buttons:        Boolean,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ChannelSettings = ChannelSettingsSchema & Document<any, any, ChannelSettingsSchema>

const chatPhotoSchema = new Schema({
	small_file_id:        { type: String, required: true },
	small_file_unique_id: { type: String, required: true },
	big_file_id:          { type: String, required: true },
	big_file_unique_id:   { type: String, required: true },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ChatImage = ChatPhoto & Document<any, any, ChatPhoto>

interface ChannelSchema {
	_id:             number
	owner_id:        number
	type:            'private' | 'group' | 'supergroup' | 'channel'
	title:           string
	photo?:          ChatPhoto
	bio?:            string
	description?:    string
	invite_link?:    string
	linked_chat_id?: string
	username?:       string

	settings:        ChannelSettings

	createdAt:       Date
	updatedAt:       Date
}

const channelSchema = new Schema({
	_id:            { type: Number, required: true },
	owner_id:       { type: Number, required: true },
	type:           { type: String, required: true },
	title:          { type: String, required: true },
	photo:          chatPhotoSchema,
	bio:            String,
	description:    String,
	invite_link:    String,
	linked_chat_id: String,
	username:       String,

	settings:       { type: channelSettingsSchema, required: true },
}, { timestamps: true })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Channel = ChannelSchema & Document<any, any, ChannelSchema>
export default model<ChannelSchema>('Channel', channelSchema)