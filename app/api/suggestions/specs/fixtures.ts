import testingDB, { DBFixture } from 'api/utils/testing_db';
import { SuggestionState } from 'shared/types/suggestionSchema';

export const fixtures: DBFixture = {
  ixsuggestions: [
    {
      propertyName: 'title',
      entity: 'shared1',
      suggestedValue: 'HCT-04-CR-SC-0074-2013: Uganda vs Olowo Kamali',
      segment: 'Lorem ipsum dolor HCT-04-CR-SC-0074-2013: Uganda vs Olowo Kamali sit amet.',
      language: 'en',
      state: SuggestionState.filled,
      page: 1,
    },
    {
      propertyName: 'property_1',
      entity: 'shared1',
      suggestedValue: 'first suggestion',
      segment: 'segment with first suggestion test',
      language: 'en',
      state: SuggestionState.filled,
      page: 1,
    },
  ],
  entities: [
    {
      _id: testingDB.id(),
      sharedId: 'shared1',
      type: 'entity',
      language: 'en',
      title: 'Entity 1',
      metadata: {
        property_1: [{ value: 'value 1' }],
      },
    },
  ],
};
