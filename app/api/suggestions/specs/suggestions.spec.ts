import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';

import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { Suggestions } from '../suggestions';
import { fixtures, personTemplateId } from './fixtures';

describe('suggestions', () => {
  beforeEach(done => {
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('deleteByProperty()', () => {
    it('should delete all suggestions of a given property', async () => {
      const suggestions = await IXSuggestionsModel.get({ propertyName: 'title' });
      expect(suggestions.length).toBe(6);

      await Suggestions.deleteByProperty('title', personTemplateId.toString());
      const newSuggestions = await IXSuggestionsModel.get({ propertyName: 'title' });
      expect(newSuggestions.length).toBe(2);
    });
  });

  describe('get()', () => {
    it('should return all suggestions', async () => {
      const { suggestions } = await Suggestions.get({}, { page: { size: 50, number: 1 } });
      expect(suggestions.length).toBe(14);
    });

    it('should be able to filter', async () => {
      const { suggestions } = await Suggestions.get(
        { propertyName: 'super_powers' },
        { page: { size: 50, number: 1 } }
      );
      expect(suggestions.length).toBe(2);
    });

    it('should return the status', async () => {
      const { suggestions: superPowersSuggestions } = await Suggestions.get(
        { propertyName: 'super_powers' },
        { page: { size: 2, number: 1 } }
      );

      expect(
        superPowersSuggestions.find((s: EntitySuggestionType) => s.language === 'en').state
      ).toBe('Label Match');

      expect(
        superPowersSuggestions.find((s: EntitySuggestionType) => s.language === 'es').state
      ).toBe('Label Mismatch');

      const { suggestions: enemySuggestions } = await Suggestions.get(
        { propertyName: 'enemy' },
        { page: { size: 3, number: 1 } }
      );

      expect(
        enemySuggestions.find((s: EntitySuggestionType) => s.sharedId === 'shared1').state
      ).toBe('Value Match');
      expect(
        enemySuggestions.find(
          (s: EntitySuggestionType) => s.sharedId === 'shared6' && s.language === 'en'
        ).state
      ).toBe('Value Mismatch');
      expect(
        enemySuggestions.find(
          (s: EntitySuggestionType) => s.sharedId === 'shared6' && s.language === 'es'
        ).state
      ).toBe('Empty');
    });
  });
});
