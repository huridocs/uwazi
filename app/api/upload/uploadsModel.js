import mongoose from 'mongoose';
import date from 'api/utils/date.js';

import instanceModel from 'api/odm';

const uploadSchema = new mongoose.Schema({
  originalname: String,
  filename: String,
  mimetype: String,
  size: Number,
  creationDate: { type: Number, default: date.currentUTC },
}, { emitIndexErrors: true });

const schema = mongoose.model('uploads', uploadSchema);
const Model = instanceModel(schema);

export default Model;
