import { getSuggestionState } from 'shared/getIXSuggestionState';
import { propertyTypes } from 'shared/propertyTypes';
import { SuggestionState } from 'shared/types/suggestionSchema';

describe('getSuggestionState should return correct state', () => {
  it.each([
    {
      currentValue: 'same',
      labeledValue: '',
      suggestedValue: 'other',
      expectedState: SuggestionState.valueMismatch,
    },
    {
      currentValue: 'same',
      labeledValue: 'same',
      suggestedValue: 'other',
      expectedState: SuggestionState.labelMismatch,
    },
    {
      currentValue: 'same',
      labeledValue: '',
      suggestedValue: 'same',
      expectedState: SuggestionState.valueMatch,
    },
    {
      currentValue: 'same\nother',
      labeledValue: '',
      suggestedValue: 'same other',
      expectedState: SuggestionState.valueMatch,
    },
    {
      currentValue: 'same',
      labeledValue: 'same',
      suggestedValue: 'same',
      expectedState: SuggestionState.labelMatch,
    },
    {
      currentValue: 'same\nother',
      labeledValue: 'same other',
      suggestedValue: 'same other',
      expectedState: SuggestionState.labelMatch,
    },
  ])('for strings', async ({ currentValue, labeledValue, suggestedValue, expectedState }) => {
    const state = getSuggestionState(
      {
        currentValue,
        labeledValue,
        suggestedValue,
        modelCreationDate: 0,
        error: '',
        date: 0,
      },
      propertyTypes.text
    );

    expect(state).toBe(expectedState);
  });

  it.each([
    {
      currentValue: 1,
      labeledValue: '',
      suggestedValue: 2,
      expectedState: SuggestionState.valueMismatch,
    },
    {
      currentValue: 3,
      labeledValue: 3,
      suggestedValue: 4,
      expectedState: SuggestionState.labelMismatch,
    },
    {
      currentValue: 5,
      labeledValue: '',
      suggestedValue: 5,
      expectedState: SuggestionState.valueMatch,
    },
    {
      currentValue: 6,
      labeledValue: '',
      suggestedValue: '6',
      expectedState: SuggestionState.valueMatch,
    },
    {
      currentValue: '7',
      labeledValue: '',
      suggestedValue: 7,
      expectedState: SuggestionState.valueMatch,
    },
    {
      currentValue: 8,
      labeledValue: 8,
      suggestedValue: 8,
      expectedState: SuggestionState.labelMatch,
    },
    {
      currentValue: '8',
      labeledValue: 8,
      suggestedValue: 8,
      expectedState: SuggestionState.labelMatch,
    },
    {
      currentValue: 'text',
      labeledValue: 'text',
      suggestedValue: 8,
      expectedState: SuggestionState.labelMismatch,
    },
  ])('for numbers', async ({ currentValue, labeledValue, suggestedValue, expectedState }) => {
    const state = getSuggestionState(
      {
        currentValue,
        labeledValue,
        suggestedValue,
        modelCreationDate: 0,
        error: '',
        date: 0,
      },
      propertyTypes.numeric
    );

    expect(state).toBe(expectedState);
  });
});
