// import { Audio, MessageEntity, Document as MessageDocument, PhotoSize, Sticker, Video, VideoNote, Voice, Contact, Game, Dice, Poll, Venue, ReplyKeyboardMarkup } from '@grammyjs/types'
import { Schema, model, Document } from 'mongoose'
export interface MessageSchema {
	sent_message_id?:    number
	received_message_id: number,
	received_chat_id:    number,
	received_date:       number,
	sent_date?:          number,

	text?:               string,
	caption?:            string,
}

const messageSchema = new Schema({
	sent_message_id:     Number,
	received_message_id: { type: Number, required: true },
	received_chat_id:    { type: Number, required: true },
	received_date:       { type: Number, required: true },
	sent_date:           Number,

	text:                String,
	caption:             String,
	// entities:          [mentionSchema],
	// caption_entities:  [mentionSchema],
	// audio:             audioSchema,
	// document:          documentSchema,
	// photo:             [photoSizeSchema],
	// sticker:           stickerSchema,
	// video:             videoScheme,
})
export interface PostSchema {
	owner_id: number,
	channels: number[],

	messages:  MessageSchema[]

	createdAt: Date
	updatedAt: Date
}

const postSchema = new Schema({
	owner_id: { type: Number, required: true },
	channels: { type: [Number], required: true },

	messages: [messageSchema],
}, { timestamps: true })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Post = PostSchema & Document<any, any, PostSchema>
export default model<PostSchema>('User', postSchema)