// import { Audio, MessageEntity, Document as MessageDocument, PhotoSize, Sticker, Video, VideoNote, Voice, Contact, Game, Dice, Poll, Venue, ReplyKeyboardMarkup } from '@grammyjs/types'
import { Schema, model, Document } from 'mongoose'

export interface PostSchema {
	owner_id:            number
	chat_id:             number
	channels:            number[]
	channel_message_id?: number
	received_message_id: number
	date:                number

	text?:             string
	caption?:          string
	// entities?:         MessageEntity[]
	// caption_entities?: MessageEntity[]
	// animation?:        Animation
	// audio?:            Audio
	// document?:         MessageDocument
	// photo?:            PhotoSize[]
	// sticker?:          Sticker
	// video?:            Video
	// video_note?:       VideoNote
	// voice?:            Voice
	// contact?:          Contact
	// dice?:             Dice
	// game?:             Game
	// poll?:             Poll
	// venue?:            Venue
	// location?:         Location

	// reply_markup?:     ReplyKeyboardMarkup

	createdAt:     Date
	updatedAt:     Date
}
const postSchema = new Schema({
	owner_id:            { type: Number, required: true },
	chat_id:             { type: Number, required: true },
	channels:            [Number],
	channel_message_id:  Number,
	received_message_id: { type: Number, required: true },
	date:                { type: Number, required: true },

	text:              String,
	caption:           String,
	// entities:          [mentionSchema],
	// caption_entities:  [mentionSchema],
	// audio:             audioSchema,
	// document:          documentSchema,
	// photo:             [photoSizeSchema],
	// sticker:           stickerSchema,
	// video:             videoScheme,
}, { timestamps: true })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Post = PostSchema & Document<any, any, PostSchema>
export default model<PostSchema>('User', postSchema)