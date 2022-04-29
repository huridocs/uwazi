import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';

import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { Suggestions } from '../suggestions';
import { fixtures, personTemplateId } from './fixtures';

const getSuggestions = async (propertyName: string) =>
  Suggestions.get({ propertyName }, { page: { size: 5, number: 1 } });

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
    it('should return all title suggestions', async () => {
      const { suggestions } = await Suggestions.get(
        { propertyName: 'title' },
        { page: { size: 50, number: 1 } }
      );
      expect(suggestions.length).toBe(6);
    });

    it('should be able to filter', async () => {
      const { suggestions } = await Suggestions.get(
        { propertyName: 'super_powers' },
        { page: { size: 50, number: 1 } }
      );
      expect(suggestions.length).toBe(2);
    });

    it('should return match status', async () => {
      const { suggestions: superPowersSuggestions } = await getSuggestions('super_powers');

      expect(
        superPowersSuggestions.find((s: EntitySuggestionType) => s.language === 'en').state
      ).toBe(SuggestionState.labelMatch);

      const { suggestions: enemySuggestions } = await getSuggestions('enemy');

      expect(
        enemySuggestions.filter(
          (s: EntitySuggestionType) => s.sharedId === 'shared6' && s.language === 'en'
        )[1].state
      ).toBe(SuggestionState.labelEmpty);

      expect(
        enemySuggestions.find((s: EntitySuggestionType) => s.sharedId === 'shared1').state
      ).toBe(SuggestionState.valueMatch);

      expect(
        enemySuggestions.find(
          (s: EntitySuggestionType) => s.sharedId === 'shared6' && s.language === 'es'
        ).state
      ).toBe(SuggestionState.empty);

      const { suggestions: ageSuggestions } = await getSuggestions('age');

      expect(ageSuggestions.length).toBe(3);
      expect(ageSuggestions.find((s: EntitySuggestionType) => s.sharedId === 'shared5').state).toBe(
        SuggestionState.obsolete
      );

      expect(ageSuggestions.find((s: EntitySuggestionType) => s.sharedId === 'shared3').state).toBe(
        SuggestionState.valueEmpty
      );
    });

    it('should return mismatch status', async () => {
      const { suggestions: superPowersSuggestions } = await getSuggestions('super_powers');
      expect(
        superPowersSuggestions.find((s: EntitySuggestionType) => s.language === 'es').state
      ).toBe(SuggestionState.labelMismatch);

      const { suggestions: enemySuggestions } = await getSuggestions('enemy');
      expect(
        enemySuggestions.find(
          (s: EntitySuggestionType) => s.sharedId === 'shared6' && s.language === 'en'
        ).state
      ).toBe(SuggestionState.valueMismatch);
    });

    it('should return error status', async () => {
      const { suggestions } = await getSuggestions('age');
      expect(suggestions.find((s: EntitySuggestionType) => s.sharedId === 'shared4').state).toBe(
        SuggestionState.error
      );
    });
  });
});
