import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';
import { SegmentationType } from 'shared/types/segmentationType';

const props = {};

const mongoSchema = new mongoose.Schema(props, {
  emitIndexErrors: true,
  strict: false,
});

const IXSuggestionsModel = instanceModel<SegmentationType>('ixsuggestions', mongoSchema);

export { IXSuggestionsModel };
