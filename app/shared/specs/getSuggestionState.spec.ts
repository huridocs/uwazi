import { getSuggestionState } from 'shared/getIXSuggestionState';
import { propertyTypes } from 'shared/propertyTypes';
import { SuggestionState } from 'shared/types/suggestionSchema';

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
])(
  'should compare two string',
  async ({ currentValue, labeledValue, suggestedValue, expectedState }) => {
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
  }
);
