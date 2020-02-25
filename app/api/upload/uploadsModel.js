import mongoose from 'mongoose';
import date from 'api/utils/date.js';

import { instanceModel } from 'api/odm';

const uploadSchema = new mongoose.Schema(
  {
    originalname: String,
    filename: String,
    mimetype: String,
    size: Number,
    creationDate: { type: Number, default: date.currentUTC },
  },
  { emitIndexErrors: true }
);

const Model = instanceModel('uploads', uploadSchema);

export default Model;
