import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import entities from 'api/entities/entities';
import { IXSuggestionType } from 'shared/types/suggestionType';
import _ from 'lodash';

export const Suggestions = {
  get: async () => {
    const ixSuggestions: IXSuggestionType[] = await IXSuggestionsModel.get({});
    const entitiesIds = ixSuggestions.map(suggestion => suggestion.entity);
    const propertiesNames = ixSuggestions.reduce(
      (select, suggestion) => ({ ...select, [`metadata.${suggestion.propertyName}`]: true }),
      {}
    );
    const entitiesData = await entities.get(
      { sharedId: { $in: entitiesIds }, language: 'en' },
      { title: true, sharedId: true, ...propertiesNames },
      { withoutDocuments: true }
    );
    const entitiesBySharedId = _.keyBy(entitiesData, 'sharedId');
    return ixSuggestions.map(s => {
      const entity = entitiesBySharedId[s.entity.toString()];
      return { ...s, title: entity.title, currentValue: entity.metadata[s.propertyName] };
    });
  },
};
