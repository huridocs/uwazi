import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture, testingDB } from 'api/utils/testing_db';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { getStats } from '../stats';

const fixtures: DBFixture = {
  ixsuggestions: [
    {
      _id: testingDB.id(),
      entityId: '',
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.labelEmpty,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.labelMatch,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.labelMismatch,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.valueEmpty,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.valueMatch,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.valueMismatch,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.obsolete,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.empty,
    },
    {
      _id: testingDB.id(),
      entityId: '',
      propertyName: 'age',
      suggestedValue: '',
      segment: '',
      language: '',
      state: SuggestionState.emptyMismatch,
    },
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('when the property exists', () => {
  it('should return the training stats', async () => {
    expect(await getStats('age')).toEqual({
      counts: {
        labeled: 3,
        nonLabeledMatching: 1,
        nonLabeledNotMatching: 1,
        emptyOrObsolete: 4,
        all: fixtures.ixsuggestions!.length,
      },
      accuracy: 0.5,
    });
  });
});

describe('when the property does not exists', () => {
  it('should not fail', async () => {
    await getStats('non existent prop');
  });
});
