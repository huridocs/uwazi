import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';
import { IXSuggestionType } from 'shared/types/suggestionType';

const props = {
  status: { type: String, enum: ['processing', 'failed', 'ready'], default: 'processing' },
  entityId: { type: String },
  useForTraining: { type: Boolean, default: false },
};

const mongoSchema = new mongoose.Schema(props, {
  strict: false,
});

mongoSchema.index({ extractorId: 1, 'state.labeled': 1, 'state.match': 1 });
mongoSchema.index({ extractorId: 1, 'state.labeled': 1, 'state.withSuggestion': 1 });
mongoSchema.index({ extractorId: 1, 'state.labeled': 1, 'state.hasContext': 1 });
mongoSchema.index({ extractorId: 1, 'state.labeled': 1, 'state.obsolete': 1 });
mongoSchema.index({ extractorId: 1, 'state.labeled': 1, 'state.error': 1 });
mongoSchema.index({ extractorId: 1, useForTraining: 1 });

mongoSchema.index({ extractorId: 1, date: 1, state: -1 });

// Speed up per-run lookups (previous run filters and seen-in-run checks)
mongoSchema.index({
  extractorId: 1,
  'modelData.suggestionsRunTimestamp': 1,
  status: 1,
  entityId: 1,
});

const IXSuggestionsModel = instanceModel<IXSuggestionType>('ixsuggestions', mongoSchema);

export { IXSuggestionsModel };
