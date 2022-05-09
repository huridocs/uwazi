import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';

import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { Suggestions } from '../suggestions';
import { fixtures, personTemplateId, suggestionId } from './fixtures';

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

  describe('accept()', () => {
    it('should accept a suggestion', async () => {
      const { suggestions } = await getSuggestions('super_powers');
      const labelMismatchedSuggestion = suggestions.find(
        (sug: any) => sug.state === SuggestionState.labelMismatch
      );
      await Suggestions.accept(
        {
          _id: suggestionId,
          sharedId: labelMismatchedSuggestion.sharedId,
          entityId: labelMismatchedSuggestion.entityId,
        },
        false
      );
      const { suggestions: newSuggestions } = await getSuggestions('super_powers');
      const changedSuggestion = newSuggestions.find(
        (sg: any) => sg._id.toString() === suggestionId.toString()
      );

      expect(changedSuggestion.state).toBe(SuggestionState.labelMatch);
      expect(changedSuggestion.suggestedValue).toEqual(changedSuggestion.labeledValue);
    });
    it('should not accept a suggestion with an error', async () => {
      const { suggestions } = await getSuggestions('age');
      const errorSuggestion = suggestions.find(
        (s: EntitySuggestionType) => s.sharedId === 'shared4'
      );
      try {
        await Suggestions.accept(
          {
            _id: errorSuggestion._id,
            sharedId: errorSuggestion.sharedId,
            entityId: errorSuggestion.entityId,
          },
          true
        );
      } catch (e) {
        expect(e.message).toBe('Suggestion has an error');
      }
    });
  });
});
