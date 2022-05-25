import { SuggestionState } from 'shared/types/suggestionSchema';
import { getState } from '../getState';

describe('stateTransitions', () => {
  it('should return Error if the suggestion has an error', () => {
    expect(
      getState(
        {
          error: 'Some error occurred',
          entityId: 'some entity',
          propertyName: 'some property',
          suggestedValue: null,
          segment: 'segment info',
          language: 'es',
        },
        1,
        '',
        '',
        ''
      )
    ).toBe('Error');
  });

  it('should return Obsolete if the suggestion is older than the model', () => {
    expect(
      getState(
        {
          entityId: 'some entity',
          propertyName: 'some property',
          suggestedValue: null,
          segment: 'segment info',
          language: 'es',
          date: 0,
        },
        1,
        '',
        '',
        ''
      )
    ).toBe(SuggestionState.obsolete);
  });

  it('should return ValueEmpty if labeled, suggested values are empty but not current value', () => {
    expect(
      getState(
        {
          entityId: 'some entity',
          propertyName: 'some property',
          suggestedValue: null,
          segment: 'segment info',
          language: 'es',
          date: 2,
        },
        1,
        undefined,
        '',
        'something'
      )
    ).toBe(SuggestionState.valueEmpty);
  });

  it('should return LabelMatch if values match', () => {
    expect(
      getState(
        {
          entityId: 'some entity',
          propertyName: 'some property',
          suggestedValue: null,
          segment: 'segment info',
          language: 'es',
          date: 2,
        },
        1,
        'something',
        'something',
        'something'
      )
    ).toBe(SuggestionState.labelMatch);
  });

  it('should return Empty if current and suggested values are empty', () => {
    expect(
      getState(
        {
          entityId: 'some entity',
          propertyName: 'some property',
          suggestedValue: null,
          segment: 'segment info',
          language: 'es',
          date: 2,
        },
        1,
        'something',
        '',
        ''
      )
    ).toBe(SuggestionState.empty);
  });

  it('should return LabelEmpty if <case not clear>', () => {
    expect(
      getState(
        {
          entityId: 'some entity',
          propertyName: 'some property',
          suggestedValue: null,
          segment: 'segment info',
          language: 'es',
          date: 2,
        },
        1,
        'something',
        '',
        'something'
      )
    ).toBe(SuggestionState.labelEmpty);
  });

  it('should return LabelMissmatch if labeledValue and suggestedValue differ', () => {
    expect(
      getState(
        {
          entityId: 'some entity',
          propertyName: 'some property',
          suggestedValue: null,
          segment: 'segment info',
          language: 'es',
          date: 2,
        },
        1,
        'something',
        'something else',
        'something'
      )
    ).toBe(SuggestionState.labelMismatch);
  });

  it('should return ValueMatch if suggested and current values match', () => {
    expect(
      getState(
        {
          entityId: 'some entity',
          propertyName: 'some property',
          suggestedValue: null,
          segment: 'segment info',
          language: 'es',
          date: 2,
        },
        1,
        'something else',
        'something',
        'something'
      )
    ).toBe(SuggestionState.valueMatch);
  });

  it('should return ValueMissmatch if suggested and current values differ', () => {
    expect(
      getState(
        {
          entityId: 'some entity',
          propertyName: 'some property',
          suggestedValue: null,
          segment: 'segment info',
          language: 'es',
          date: 2,
        },
        1,
        'something else',
        'something',
        'some other thing'
      )
    ).toBe(SuggestionState.valueMismatch);
  });
});
