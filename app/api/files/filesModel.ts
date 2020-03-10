import mongoose from 'mongoose';
import date from 'api/utils/date.js';

import { instanceModel } from 'api/odm';
import { FileType } from '../../shared/types/fileType';

const propsWithDBSpecifics = {
  creationDate: { type: Number, default: date.currentUTC },
  fullText: { type: mongoose.Schema.Types.Mixed, select: false },
  entity: { type: String, index: true },
};

const mongoSchema = new mongoose.Schema(propsWithDBSpecifics, {
  emitIndexErrors: true,
  strict: false,
});

const Model = instanceModel<FileType>('files', mongoSchema);

export default Model;
