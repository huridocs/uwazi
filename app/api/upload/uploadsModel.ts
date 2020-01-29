/** @format */

import mongoose from 'mongoose';
import date from 'api/utils/date.js';

import { instanceModel } from 'api/odm';
import { UploadSchema } from './uploadType';

const propsWithDBSpecifics = {
  creationDate: { type: Number, default: date.currentUTC },
  fullText: { type: mongoose.Schema.Types.Mixed, select: false },
};

const mongoSchema = new mongoose.Schema(propsWithDBSpecifics, {
  emitIndexErrors: true,
  strict: false,
});

const Model = instanceModel<UploadSchema>('uploads', mongoSchema);

export default Model;
