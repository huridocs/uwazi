import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';
import { IXSuggestionType } from 'shared/types/suggestionType';

const props = {
  status: { type: String, enum: ['processing', 'failed', 'ready'], default: 'processing' },
  entityId: { type: String },
};

const mongoSchema = new mongoose.Schema(props, {
  emitIndexErrors: true,
  strict: false,
});

// @ts-ignore
mongoSchema.index({ propertyName: 'text' }, { language_override: '_text' });

const IXSuggestionsModel = instanceModel<IXSuggestionType>('ixsuggestions', mongoSchema);

export { IXSuggestionsModel };
