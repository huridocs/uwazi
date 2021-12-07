import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';
import { ObjectIdSchema } from '../../../shared/types/commonTypes';

export enum OcrStatus {
  NONE = 'noOCR',
  PROCESSING = 'inQueue',
  ERROR = 'cannotProcess',
  READY = 'withOCR',
}

const props = {
  autoexpire: { type: Date, expires: 86400, default: Date.now }, // 24 hours
  file: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  language: { type: String },
  status: { type: String, enum: OcrStatus , default: 'processing' },
};

export interface OcrRecord {
  _id: ObjectIdSchema,
  autoexpire: number,
  language: string,
  status: OcrStatus,
  file: ObjectIdSchema
};

const mongoSchema = new mongoose.Schema(props, {
  emitIndexErrors: true,
  strict: false,
});

const OcrModel = instanceModel<OcrRecord>('ocr', mongoSchema);

export { OcrModel };
