import { DBFixture } from 'api/utils/testing_db';
import { SuggestionState } from 'shared/types/suggestionSchema';

export const fixtures: DBFixture = {
  ixsuggestions: [
    {
      entityId: 'shared1',
      propertyName: 'title',
      entityTitle: 'Entity 1',
      suggestedValue: 'HCT-04-CR-SC-0074',
      currentValue: 'wrong data',
      segment: 'Lorem ipsum dolor HCT-04-CR-SC-0074-2013: Uganda vs Olowo Kamali sit amet.',
      language: 'en',
      state: SuggestionState.matching,
      page: 1,
    },
    {
      entityId: 'shared2',
      entityTitle: 'Entity 2',
      propertyName: 'property_1',
      suggestedValue: 'first suggestion',
      segment: 'segment with first suggestion test',
      language: 'en',
      state: SuggestionState.matching,
      page: 1,
    },
  ],
};
