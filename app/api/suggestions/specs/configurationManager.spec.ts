import { testingEnvironment } from 'api/utils/testingEnvironment';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { createDefaultSuggestions } from '../configurationManager';
import { IXSuggestionsModel } from '../IXSuggestionsModel';
import { fixtures, personTemplateId } from './fixtures';

describe('createBlankStates()', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create blank states based on settings', async () => {
    await IXSuggestionsModel.delete({});
    const settings = [
      {
        template: personTemplateId,
        properties: ['title'],
      },
    ];

    await createDefaultSuggestions(settings, 'en', 2);
    const newSuggestions = await IXSuggestionsModel.get({
      propertyName: 'title',
    });

    expect(newSuggestions.length).toBe(2);
    expect(newSuggestions[0].state).toBe(SuggestionState.valueEmpty);
    expect(newSuggestions[1].state).toBe(SuggestionState.valueEmpty);
  });
});
