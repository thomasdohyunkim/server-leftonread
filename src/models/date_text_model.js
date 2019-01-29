import mongoose, { Schema } from 'mongoose';

// Schema for dates containing text info for that date
const DateTextSchema = new Schema({
  // User info
  key: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Text info
  date: Date,
  display: String,
  number: String,
  sentWords: [String],
  sentFrequency: [Number],
  recWords: [String],
  recFrequency: [Number],


  // General overall analytics
  avgLengthReceived: Number,
  receivedTexts: { type: Number, default: 0 },

  avgLengthSent: Number,
  sentTexts: { type: Number, default: 0 },

  sentSentimentLove: { type: Number, default: 0 },
  recSentimentLove: { type: Number, default: 0 },
  sentSentimentHappy: { type: Number, default: 0 },
  recSentimentHappy: { type: Number, default: 0 },
  sentSentimentAnger: { type: Number, default: 0 },
  recSentimentAnger: { type: Number, default: 0 },
  sentSentimentStress: { type: Number, default: 0 },
  recSentimentStress: { type: Number, default: 0 },
  sentSentimentSocial: { type: Number, default: 0 },
  recSentimentSocial: { type: Number, default: 0 },

  timeReceived: { type: [Number], default: Array(48).fill(0) },
  timeSent: { type: [Number], default: Array(48).fill(0) },

}, {
  toJSON: {
    virtuals: true,
  },
});

DateTextSchema.set('versionKey', false);

const DateTextModel = mongoose.model('DateText', DateTextSchema);

export default DateTextModel;
