import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';
import { IXSuggestionType } from 'shared/types/suggestionType';

const props = {
  status: { type: String, enum: ['processing', 'failed', 'ready'], default: 'processing' },
  entityId: { type: String },
};

const mongoSchema = new mongoose.Schema(props, {
  strict: false,
});

mongoSchema.index({ entityId: 1 });
mongoSchema.index({ fileId: 1 });
mongoSchema.index({ extractorId: 1, entityId: 1, fileId: 1 });
mongoSchema.index({ extractorId: 1, 'state.labeled': 1, 'state.match': 1 });
mongoSchema.index({ extractorId: 1, 'state.labeled': 1, 'state.withSuggestion': 1 });
mongoSchema.index({ extractorId: 1, 'state.labeled': 1, 'state.hasContext': 1 });
mongoSchema.index({ extractorId: 1, 'state.labeled': 1, 'state.obsolete': 1 });
mongoSchema.index({ extractorId: 1, 'state.labeled': 1, 'state.error': 1 });

const IXSuggestionsModel = instanceModel<IXSuggestionType>('ixsuggestions', mongoSchema);

export { IXSuggestionsModel };
