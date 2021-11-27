// import { Audio, MessageEntity, Document as MessageDocument, PhotoSize, Sticker, Video, VideoNote, Voice, Contact, Game, Dice, Poll, Venue, ReplyKeyboardMarkup } from '@grammyjs/types'
import { Schema, model, Document, ObjectId } from 'mongoose'
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
	_id:      ObjectId
	owner_id: number
	channels: number[]

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
export default model<PostSchema>('Post', postSchema)




// const mentionSchema = new Schema({
// 	type:   { type: String, required: true },
// 	offset: { type: Number, required: true },
// 	length: { type: Number, required: true },
// })

// const photoSizeSchema = new Schema({
// 	file_id:        { type: String, required: true },
// 	file_unique_id: { type: String, required: true },
// 	width:          { type: Number, required: true },
// 	height:         { type: Number, required: true },
// 	file_size:      Number,
// })

// const audioSchema = new Schema({
// 	file_id:        { type: String, required: true },
// 	file_unique_id: { type: String, required: true },
// 	duration:       { type: Number, required: true },
// 	performer:      String,
// 	title:          String,
// 	file_name:      String,
// 	mime_type:      String,
// 	file_size:      Number,
// 	thumb:          photoSizeSchema
// })

// const maskPositionSchema = new Schema({
// 	point:   { type: String, required: true },
// 	x_shift: { type: Number, required: true },
// 	y_shift: { type: Number, required: true },
// 	scale:   { type: Number, required: true },
// })

// const stickerSchema = new Schema({
// 	file_id: { type: String, required: true },
// 	file_unique_id: { type: String, required: true },
// 	width: { type: Number, required: true },
// 	height: { type: Number, required: true },
// 	is_animated: { type: Boolean, required: true },
// 	thumb: photoSizeSchema,
// 	emoji: String,
// 	set_name: String,
// 	mask_position: maskPositionSchema,
// 	file_size: Number,
// })

// const documentSchema = new Schema({
// 	file_id:        { type: String, required: true },
// 	file_unique_id: { type: String, required: true },
// 	thumb:          photoSizeSchema,
// 	file_name:      String,
// 	mime_type:      String,
// 	file_size:      Number,
// })

// const videoSchema = new Schema({
//   file_id: string;
//   file_unique_id: string;
//   width: number;
//   height: number;
//   duration: number;
//   thumb?: PhotoSize;
//   file_name?: string;
//   mime_type?: string;
//   file_size?: number;
// })