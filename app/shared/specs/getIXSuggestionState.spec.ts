/* eslint-disable max-statements */
import { SuggestionOptionValue } from 'shared/types/suggestionType';
import { getSuggestionState, SuggestionValues } from '../getIXSuggestionState';

describe('getIXSuggestionState', () => {
  describe('getSuggestionState', () => {
    const emptySuggestion: SuggestionValues = {
      currentValue: '',
      date: 1234,
      suggestedValue: '',
      obsolete: false,
      error: '',
      segment: null,
      status: null,
    };

    it('should mark when suggestedValue, labeledValue and currentValue are empty', () => {
      const state = getSuggestionState(emptySuggestion, 'text');

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

    it('should mark when labeledValue has value and suggestedValue is empty', () => {
      const values: SuggestionValues = {
        ...emptySuggestion,
        currentValue: 'Some value',
        segment: '',
        status: 'ready',
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual({
        labeled: true,
        withValue: true,
        withSuggestion: false,
        match: false,
        hasContext: false,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should mark when currentValue has value and suggestedValue, labeledValue are empty', () => {
      const values: SuggestionValues = {
        ...emptySuggestion,
        currentValue: 'some value',
        segment: '',
        status: 'ready',
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual({
        labeled: true,
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
      const values: SuggestionValues = {
        ...emptySuggestion,
        currentValue: 'some value',
        error: 'some error occurred',
        segment: '',
        status: 'error',
      };

      const state = getSuggestionState(values, 'text');

      expect(state).toEqual({
        labeled: true,
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
      const values: SuggestionValues = {
        ...emptySuggestion,
        currentValue: 'some label value',
        suggestedValue: 'some label value',
        segment: '',
        status: 'ready',
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
      const values: SuggestionValues = {
        ...emptySuggestion,
        currentValue: 'some value',
        suggestedValue: 'some value',
        segment: '',
        status: 'ready',
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

    it('should mark when currentValue != suggestedValue, labeledValue is empty', () => {
      const values: SuggestionValues = {
        ...emptySuggestion,
        currentValue: 'some other value',
        suggestedValue: 'some value',
        segment: '',
        status: 'ready',
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

    it('should mark when currentValue != suggestedValue, labeledValue is not empty', () => {
      const values: SuggestionValues = {
        ...emptySuggestion,
        currentValue: 'some other value',
        suggestedValue: 'some value',
        segment: '',
        status: 'ready',
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
      const values: SuggestionValues = {
        ...emptySuggestion,
        suggestedValue: 'some value',
        segment: '',
        status: 'ready',
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
      const values: SuggestionValues = {
        ...emptySuggestion,
        suggestedValue: 'some value',
        obsolete: true,
        segment: '',
        status: 'ready',
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
      const values: SuggestionValues = {
        ...emptySuggestion,
        suggestedValue: 'some value',
        status: 'processing',
        segment: '',
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

    it('should mark match when suggestedValue contains objects with matching IDs for multiselect', () => {
      const values: SuggestionValues = {
        ...emptySuggestion,
        currentValue: ['value1', 'value2'],
        suggestedValue: <SuggestionOptionValue[]>[
          { id: 'value1', label: 'Label 1' },
          { id: 'value2', label: 'Label 2' },
        ],
      };

      const state = getSuggestionState(values, 'multiselect');

      expect(state).toEqual({
        labeled: true,
        withValue: true,
        withSuggestion: true,
        match: true,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should mark no match when suggestedValue contains objects with non-matching IDs for multiselect', () => {
      const values: SuggestionValues = {
        ...emptySuggestion,
        currentValue: ['value1', 'value3'],
        suggestedValue: <SuggestionOptionValue[]>[
          { id: 'value1', label: 'Label 1' },
          { id: 'value2', label: 'Label 2' },
        ],
      };

      const state = getSuggestionState(values, 'multiselect');

      expect(state).toEqual({
        labeled: true,
        withValue: true,
        withSuggestion: true,
        match: false,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should mark match when suggestedValue contains objects with matching ID for select', () => {
      const values: SuggestionValues = {
        ...emptySuggestion,
        currentValue: 'value1',
        suggestedValue: <SuggestionOptionValue[]>[{ id: 'value1', label: 'Label 1' }],
      };

      const state = getSuggestionState(values, 'select');

      expect(state).toEqual({
        labeled: true,
        withValue: true,
        withSuggestion: true,
        match: true,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should mark no match when suggestedValue contains objects with non-matching ID for select', () => {
      const values: SuggestionValues = {
        ...emptySuggestion,
        currentValue: 'value2',
        suggestedValue: <SuggestionOptionValue[]>[{ id: 'value1', label: 'Label 1' }],
      };

      const state = getSuggestionState(values, 'select');

      expect(state).toEqual({
        labeled: true,
        withValue: true,
        withSuggestion: true,
        match: false,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should mark match when suggestedValue contains objects with segment_text and matching ID for select', () => {
      const values: SuggestionValues = {
        ...emptySuggestion,
        currentValue: 'value1',
        suggestedValue: <SuggestionOptionValue[]>[
          { id: 'value1', label: 'Label 1', segment: 'context for value1' },
        ],
      };

      const state = getSuggestionState(values, 'select');

      expect(state).toEqual({
        labeled: true,
        withValue: true,
        withSuggestion: true,
        match: true,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should mark match when suggestedValue contains objects with segment_text and matching IDs for multiselect', () => {
      const values: SuggestionValues = {
        ...emptySuggestion,
        currentValue: ['value1', 'value2'],
        suggestedValue: <SuggestionOptionValue[]>[
          { id: 'value1', label: 'Label 1', segment: 'context for value1' },
          { id: 'value2', label: 'Label 2', segment: 'context for value2' },
        ],
      };

      const state = getSuggestionState(values, 'multiselect');

      expect(state).toEqual({
        labeled: true,
        withValue: true,
        withSuggestion: true,
        match: true,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      });
    });
  });
});
