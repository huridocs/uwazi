import { getSuggestionState, SuggestionValues } from '../getIXSuggestionState';

describe('getIXSuggestionState', () => {
  describe('getSuggestionState', () => {
    it('should return empty when suggestedValue, labeledValue and currentValue are empty', () => {
      const values = <SuggestionValues>{
        currentValue: '',
        date: 1234,
        labeledValue: '',
        suggestedValue: '',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual('Empty / Empty');
    });

    it('should return empty / lebel when lebeledValue has value and suggestedValue is empty', () => {
      const values = <SuggestionValues>{
        currentValue: '',
        date: 1234,
        labeledValue: 'Some value',
        suggestedValue: '',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual('Empty / Label');
    });

    it('should return empty / value when currentValue has value and suggestedValue, labeledValue are empty', () => {
      const values = <SuggestionValues>{
        currentValue: 'some value',
        date: 1234,
        labeledValue: '',
        suggestedValue: '',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual('Empty / Value');
    });
    it('should return error when error is not empty', () => {
      const values = <SuggestionValues>{
        currentValue: 'some value',
        date: 1234,
        error: 'some error occurred',
        labeledValue: '',
        suggestedValue: '',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual('Error');
    });

    it('should return match / label when currentValue = suggestedValue, labeledValue is not empty', () => {
      const values = <SuggestionValues>{
        currentValue: 'some label value',
        date: 1234,
        labeledValue: 'some label value',
        suggestedValue: 'some label value',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual('Match / Label');
    });

    it('should return match / value when currentValue = suggestedValue, labeledValue are empty', () => {
      const values = <SuggestionValues>{
        currentValue: 'some value',
        date: 1234,
        labeledValue: '',
        suggestedValue: 'some value',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual('Match / Value');
    });

    it('should return mismatch / value when currentValue != suggestedValue, labeledValue are empty', () => {
      const values = <SuggestionValues>{
        currentValue: 'some other value',
        date: 1234,
        labeledValue: '',
        suggestedValue: 'some value',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual('Mismatch / Value');
    });

    it('should return mismatch / label when currentValue != suggestedValue, labeledValue is not empty', () => {
      const values = <SuggestionValues>{
        currentValue: 'some other value',
        date: 1234,
        labeledValue: 'some other value',
        suggestedValue: 'some value',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual('Mismatch / Label');
    });

    it('should return mismatch / empty when currentValue != suggestedValue, labeledValue is empty', () => {
      const values = <SuggestionValues>{
        currentValue: '',
        date: 1234,
        labeledValue: '',
        suggestedValue: 'some value',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual('Mismatch / Empty');
    });

    it('should return obsolete when modelCreationDate < date', () => {
      const values = <SuggestionValues>{
        currentValue: '',
        date: 1234,
        labeledValue: '',
        suggestedValue: 'some value',
        modelCreationDate: 200000,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual('Obsolete');
    });
  });
});
