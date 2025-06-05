import { MultiValueSuggestion } from '../../types';
import { updateSuggestionsByEntity } from '../helpers';
import {
  suggestion1,
  suggestion2,
  suggestion3,
  suggestion5,
  entity1,
  entity2,
  entity3,
  propertyTitle,
  propertyDocumentDate,
  propertyMultiselect,
} from './fixtures';

describe('updateSuggestionsByEntity', () => {
  it('should update the suggestions current value', () => {
    const result = updateSuggestionsByEntity(
      [suggestion1, suggestion2],
      {
        ...entity1,
        title: 'New title for entity 1',
      },
      propertyTitle
    );

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
    const result = updateSuggestionsByEntity(
      [suggestion1, suggestion2],
      {
        ...entity1,
        title: 'suggested value',
      },
      propertyTitle
    );

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
    const result = updateSuggestionsByEntity(
      [suggestion1, suggestion3],
      {
        ...entity2,
        metadata: {
          document_date: [
            {
              value: 200,
            },
          ],
        },
      },
      propertyDocumentDate
    );

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

  describe('Multiselect property', () => {
    it('should update the suggestions current value', () => {
      const result = updateSuggestionsByEntity(
        [suggestion5],
        {
          ...entity3,
          metadata: {
            multiselect: [
              {
                value: 'value3',
              },
              {
                value: 'value2',
              },
            ],
          },
        },
        propertyMultiselect
      ) as MultiValueSuggestion[];

      expect(result![0].subRows?.length).toBe(2);
      expect(result).toEqual([
        {
          ...suggestion5,
          currentValue: ['value3', 'value2'],
          subRows: [
            {
              ...suggestion5,
              rowId: '5-value3',
              suggestedValue: 'value3',
              currentValue: 'value3',
              propertyName: 'multiselect',
              entityId: 'entity3',
              sharedId: '3',
              entityTitle: '',
              _id: '5',
              isChild: true,
              disableRowSelection: true,
              subRows: undefined,
            },
            {
              ...suggestion5,
              rowId: '5-value2',
              suggestedValue: 'value2',
              currentValue: 'value2',
              propertyName: 'multiselect',
              entityId: 'entity3',
              sharedId: '3',
              entityTitle: '',
              _id: '5',
              isChild: true,
              disableRowSelection: true,
              subRows: undefined,
            },
          ],
        },
      ]);
    });
  });
});
