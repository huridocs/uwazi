import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';
import { SegmentationType } from 'shared/types/segmentationType';

const props = {
  autoexpire: { type: Date, expires: 86400, default: Date.now }, // 24 hours
  fileID: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  status: { type: String, enum: ['processing', 'failed', 'ready'], default: 'processing' },
};

const mongoSchema = new mongoose.Schema(props, {
  strict: false,
});

const SegmentationModel = instanceModel<SegmentationType>('segmentations', mongoSchema);

export { SegmentationModel };
