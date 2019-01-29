import { Schema } from 'mongoose';

const ShareUrlSchema = new Schema(
  {
    key: { type: String, unique: true },
    graphType: String,
    graphData: Object,
    instanceKey: String,
  },
  {
    toJSON: {
      virtuals: true,
    },
  },
);

export default ShareUrlSchema;
