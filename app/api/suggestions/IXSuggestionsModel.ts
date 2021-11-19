import mongoose from 'mongoose';
import {instanceModel} from 'api/odm';
import {IXSuggestionType} from 'shared/types/suggestionType';

const props = {};

const mongoSchema = new mongoose.Schema(props, {
  emitIndexErrors: true,
  strict: false,
});

const IXSuggestionsModel = instanceModel<IXSuggestionType>('ixsuggestions', mongoSchema);

export { IXSuggestionsModel };
