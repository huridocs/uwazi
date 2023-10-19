import { updateSuggestionsByEntity } from '../helpers';
import { suggestion1, suggestion2, suggestion3, entity1, entity2 } from './fixtures';

describe('updateSuggestionsByEntity', () => {
  it('should update the suggestions current value', () => {
    const result = updateSuggestionsByEntity([suggestion1, suggestion2], {
      ...entity1,
      title: 'New title for entity 1',
    });

    expect(result).toEqual([
      {
        ...suggestion1,
        currentValue: 'New title for entity 1',
        entityTitle: 'New title for entity 1',
      },
      suggestion2,
    ]);
  });

  it('should update the match status', () => {
    const result = updateSuggestionsByEntity([suggestion1, suggestion2], {
      ...entity1,
      title: 'suggested value',
    });

    expect(result).toEqual([
      {
        ...suggestion1,
        currentValue: 'suggested value',
        entityTitle: 'suggested value',
        state: { ...suggestion1.state, match: true },
      },
      suggestion2,
    ]);
  });

  it('should work with metadata properties', () => {
    const result = updateSuggestionsByEntity([suggestion1, suggestion3], {
      ...entity2,
      metadata: {
        document_date: [
          {
            value: 200,
          },
        ],
      },
    });

    expect(result).toEqual([
      suggestion1,
      {
        ...suggestion3,
        currentValue: 200,
        suggestedValue: 100,
        state: {
          ...suggestion3.state,
          match: false,
        },
      },
    ]);
  });
});
