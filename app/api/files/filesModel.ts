import mongoose from 'mongoose';
import date from 'api/utils/date.js';

import { instanceModel } from 'api/odm';
import { FileType } from 'shared/types/fileType';

const propsWithDBSpecifics = {
  creationDate: { type: Number, default: date.currentUTC },
  fullText: { type: mongoose.Schema.Types.Mixed, select: false },
  entity: { type: String, index: true },
  type: { type: String, index: true },
  filename: { type: String, index: true },
  __v: { type: Number, select: false },
};

const mongoSchema = new mongoose.Schema(propsWithDBSpecifics, {
  strict: false,
  versionKey: '__v',
});

mongoSchema.index({ 'toc.0': 1, type: 1 }, { partialFilterExpression: { type: 'document' } });

const filesModel = instanceModel<FileType>('files', mongoSchema);

export { filesModel };
