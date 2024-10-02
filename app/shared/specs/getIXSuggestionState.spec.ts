/* eslint-disable max-statements */
import { getSuggestionState, SuggestionValues } from '../getIXSuggestionState';

describe('getIXSuggestionState', () => {
  describe('getSuggestionState', () => {
    it('should mark when suggestedValue, labeledValue and currentValue are empty', () => {
      const values = <SuggestionValues>{
        currentValue: '',
        date: 1234,
        labeledValue: '',
        suggestedValue: '',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual({
        labeled: false,
        withValue: false,
        withSuggestion: false,
        match: false,
        hasContext: false,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should mark when lebeledValue has value and suggestedValue is empty', () => {
      const values = <SuggestionValues>{
        currentValue: '',
        date: 1234,
        labeledValue: 'Some value',
        suggestedValue: '',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual({
        labeled: true,
        withValue: false,
        withSuggestion: false,
        match: false,
        hasContext: false,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should mark when currentValue has value and suggestedValue, labeledValue are empty', () => {
      const values = <SuggestionValues>{
        currentValue: 'some value',
        date: 1234,
        labeledValue: '',
        suggestedValue: '',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual({
        labeled: false,
        withValue: true,
        withSuggestion: false,
        match: false,
        hasContext: false,
        obsolete: false,
        processing: false,
        error: false,
      });
    });
    it('should mark error when error is not empty', () => {
      const values = <SuggestionValues>{
        currentValue: 'some value',
        date: 1234,
        error: 'some error occurred',
        labeledValue: '',
        suggestedValue: '',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual({
        labeled: false,
        withValue: true,
        withSuggestion: false,
        match: undefined,
        hasContext: false,
        obsolete: false,
        processing: false,
        error: true,
      });
    });

    it('should mark when currentValue = suggestedValue, labeledValue is not empty', () => {
      const values = <SuggestionValues>{
        currentValue: 'some label value',
        date: 1234,
        labeledValue: 'some label value',
        suggestedValue: 'some label value',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual({
        labeled: true,
        withValue: true,
        withSuggestion: true,
        match: true,
        hasContext: false,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should mark when currentValue = suggestedValue, labeledValue are empty', () => {
      const values = <SuggestionValues>{
        currentValue: 'some value',
        date: 1234,
        labeledValue: '',
        suggestedValue: 'some value',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual({
        labeled: false,
        withValue: true,
        withSuggestion: true,
        match: true,
        hasContext: false,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should mark when currentValue != suggestedValue, labeledValue is empty', () => {
      const values = <SuggestionValues>{
        currentValue: 'some other value',
        date: 1234,
        labeledValue: '',
        suggestedValue: 'some value',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual({
        labeled: false,
        withValue: true,
        withSuggestion: true,
        match: false,
        hasContext: false,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should mark when currentValue != suggestedValue, labeledValue is not empty', () => {
      const values = <SuggestionValues>{
        currentValue: 'some other value',
        date: 1234,
        labeledValue: 'some other value',
        suggestedValue: 'some value',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual({
        labeled: true,
        withValue: true,
        withSuggestion: true,
        match: false,
        hasContext: false,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should mark when currentValue != suggestedValue, labeledValue is empty', () => {
      const values = <SuggestionValues>{
        currentValue: '',
        date: 1234,
        labeledValue: '',
        suggestedValue: 'some value',
        modelCreationDate: 2,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual({
        labeled: false,
        withValue: false,
        withSuggestion: true,
        match: false,
        hasContext: false,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should mark obsolete when modelCreationDate < date', () => {
      const values = <SuggestionValues>{
        currentValue: '',
        date: 1234,
        labeledValue: '',
        suggestedValue: 'some value',
        modelCreationDate: 200000,
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual({
        labeled: false,
        withValue: false,
        withSuggestion: true,
        match: undefined,
        hasContext: false,
        obsolete: true,
        processing: false,
        error: false,
      });
    });

    it('should mark processing when status is processing and set obsolete as true', () => {
      const values = <SuggestionValues>{
        currentValue: '',
        date: 1234,
        labeledValue: '',
        suggestedValue: 'some value',
        modelCreationDate: 1,
        status: 'processing',
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual({
        labeled: false,
        withValue: false,
        withSuggestion: true,
        match: undefined,
        hasContext: false,
        obsolete: true,
        processing: true,
        error: false,
      });
    });
  });
});
