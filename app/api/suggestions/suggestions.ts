import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';

export const Suggestions = {
  get: async () => IXSuggestionsModel.get({}),
};
