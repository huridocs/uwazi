import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';
import { ObjectIdSchema } from '../../../shared/types/commonTypes';

enum OcrStatus {
  NONE = 'noOCR',
  PROCESSING = 'inQueue',
  ERROR = 'cannotProcess',
  READY = 'withOCR',
  UNSUPPORTED_LANGUAGE = 'unsupported_language',
}

const props = {
  autoexpire: { type: Date, expires: 86400, default: Date.now }, // 24 hours
  sourceFile: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  resultFile: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  language: { type: String },
  status: { type: String, enum: OcrStatus, default: 'processing' },
};

interface OcrRecord {
  _id: ObjectIdSchema;
  autoexpire: number | null;
  sourceFile: ObjectIdSchema;
  resultFile?: ObjectIdSchema;
  language: string;
  status: OcrStatus;
}

const mongoSchema = new mongoose.Schema(props, {
  emitIndexErrors: true,
  strict: false,
});

const OcrModel = instanceModel<OcrRecord>('ocr_record', mongoSchema);

export type { OcrRecord };
export { OcrModel, OcrStatus };
