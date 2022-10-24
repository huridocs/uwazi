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
  sourceFile: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  resultFile: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  language: { type: String },
  status: { type: String, enum: OcrStatus, default: 'processing' },
  lastUpdated: { type: Number },
};

interface OcrRecord {
  _id: ObjectIdSchema;
  sourceFile: ObjectIdSchema | null;
  resultFile?: ObjectIdSchema;
  language: string;
  status: OcrStatus;
  lastUpdated: number;
}

const mongoSchema = new mongoose.Schema(props, {
  strict: false,
});

const OcrModel = instanceModel<OcrRecord>('ocr_record', mongoSchema);

export type { OcrRecord };
export { OcrModel, OcrStatus };
