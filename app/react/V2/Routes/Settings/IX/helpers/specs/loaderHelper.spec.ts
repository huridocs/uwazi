/**
 * @jest-environment jsdom
 */
import { ClientPropertySchema } from 'app/istore';
import { PropertySchema } from 'shared/types/commonTypes';
import {
  searchRelatedEntities,
  getPropertyValuesMap,
  getRelationshipInfo,
  updateSuggestionValues,
} from '../loaderHelper';

jest.mock('V2/api/search', () => ({
  search: jest.fn(),
}));

describe('loaderHelper', () => {
  const mockSearch = jest.requireMock('V2/api/search').search;

  const createMockEntity = (id: string, title: string, sharedId: string, metadata = {}) => ({
    _id: id,
    title,
    sharedId,
    metadata,
  });

  const createMockProperty = (name: string, type = 'text'): ClientPropertySchema => ({
    _id: `prop_${name}`,
    name,
    label: name,
    type: type as any,
  });

  const createMockPropertySchema = (name: string, type = 'relationship'): PropertySchema => ({
    _id: `prop_${name}`,
    name,
    label: name,
    type: type as any,
  });

  const createMockSuggestion = (overrides: any = {}) => ({
    _id: 'suggestion1',
    currentValue: [],
    suggestedValue: [],
    rowId: 'row1',
    disableRowSelection: false,
    extractorSource: {},
    entityId: 'entity1',
    extractorId: 'extractor1',
    entityTemplateId: 'template1',
    sharedId: 'shared1',
    fileId: 'file1',
    entityTitle: 'Entity Title',
    propertyName: 'testProperty',
    labeledValue: undefined,
    selectionRectangles: undefined,
    segment: 'segment',
    language: 'en',
    state: {
      labeled: false,
      withValue: true,
      withSuggestion: true,
      hasContext: true,
      obsolete: false,
      processing: false,
      error: false,
    },
    page: undefined,
    status: undefined,
    date: 1234567890,
    ...overrides,
  });

  const createMockRelationshipProperty = (): PropertySchema => ({
    _id: 'prop1',
    name: 'relationship_property',
    label: 'Relationship Property',
    type: 'relationship' as const,
    content: 'template1',
    inherit: {
      property: 'prop1',
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchRelatedEntities', () => {
    it('should search for entities with basic query', async () => {
      const mockEntities = [
        createMockEntity('entity1', 'Test Entity 1', 'shared1'),
        createMockEntity('entity2', 'Test Entity 2', 'shared2'),
      ];

      mockSearch.mockResolvedValue({ rows: mockEntities });

      const result = await searchRelatedEntities('template:test', undefined);

      expect(mockSearch).toHaveBeenCalledWith(
        {
          filters: { searchString: 'template:test' },
          fields: ['title', 'sharedId'],
          limit: 10,
        },
        undefined
      );

      expect(result).toEqual(mockEntities);
    });

    it('should include target property metadata field when provided', async () => {
      const targetProperty = createMockProperty('test_property');

      mockSearch.mockResolvedValue({ rows: [] });

      await searchRelatedEntities('template:test', targetProperty);

      expect(mockSearch).toHaveBeenCalledWith(
        {
          filters: { searchString: 'template:test' },
          fields: ['title', 'sharedId', 'metadata.test_property'],
          limit: 10,
        },
        undefined
      );
    });

    it('should use custom limit and headers when provided', async () => {
      const headers = { 'x-custom': 'header' };
      mockSearch.mockResolvedValue({ rows: [] });

      await searchRelatedEntities('template:test', undefined, 5, headers);

      expect(mockSearch).toHaveBeenCalledWith(
        {
          filters: {
            searchString: 'template:test',
          },
          fields: ['title', 'sharedId'],
          limit: 5,
        },
        headers
      );
    });
  });

  describe('getPropertyValuesMap', () => {
    it('should create property values map for relationship property', async () => {
      const sharedIds = new Set(['shared1', 'shared2']);
      const property = createMockPropertySchema('relationship_property');
      const targetProperty = createMockProperty('target_property');

      const mockEntities = [
        createMockEntity('entity1', 'Entity 1', 'shared1', {
          target_property: [{ value: 'Target Value 1' }],
        }),
        createMockEntity('entity2', 'Entity 2', 'shared2', {
          target_property: [{ value: 'Target Value 2' }],
        }),
      ];

      mockSearch.mockResolvedValue({ rows: mockEntities });

      const result = await getPropertyValuesMap(sharedIds, property, targetProperty, undefined);

      expect(result.get('shared1')).toBe('Target Value 1');
      expect(result.get('shared2')).toBe('Target Value 2');
    });

    it('should use title when no target property is provided', async () => {
      const sharedIds = new Set(['shared1']);
      const property = createMockPropertySchema('relationship_property');

      const mockEntities = [createMockEntity('entity1', 'Entity Title', 'shared1')];

      mockSearch.mockResolvedValue({ rows: mockEntities });

      const result = await getPropertyValuesMap(sharedIds, property, undefined, undefined);

      expect(result.get('shared1')).toBe('Entity Title');
    });
  });

  describe('getRelationshipInfo', () => {
    const mockTemplates = [
      {
        _id: 'template1',
        name: 'Template 1',
        properties: [
          {
            _id: 'prop1',
            name: 'target_property',
            label: 'Target Property',
            type: 'text' as const,
          },
        ],
      },
    ];

    it('should extract current and suggested value IDs from suggestions', () => {
      const suggestions = [
        createMockSuggestion({
          currentValue: ['current1', 'current2'],
          suggestedValue: [
            { id: 'suggested1', label: 'Suggested 1' },
            { id: 'suggested2', label: 'Suggested 2' },
          ],
        }),
      ];

      const property = createMockRelationshipProperty();
      const result = getRelationshipInfo(suggestions, property, mockTemplates);

      expect(result.allCurrentValueIds).toEqual(new Set(['current1', 'current2']));
      expect(result.allSuggestedValueIds).toEqual(new Set(['suggested1', 'suggested2']));
      expect(result.targetProperty).toEqual(mockTemplates[0].properties[0]);
    });

    it('should handle string values in current and suggested values', () => {
      const suggestions = [
        createMockSuggestion({
          currentValue: 'current1',
          suggestedValue: 'suggested1',
        }),
      ];

      const property = createMockRelationshipProperty();
      const result = getRelationshipInfo(suggestions, property, mockTemplates);

      expect(result.allCurrentValueIds).toEqual(new Set(['current1']));
      expect(result.allSuggestedValueIds).toEqual(new Set(['suggested1']));
    });
  });

  describe('updateSuggestionValues', () => {
    it('should update suggestion values with entity labels', () => {
      const suggestions = [
        createMockSuggestion({
          currentValue: ['current1', 'current2'],
          suggestedValue: ['suggested1'],
        }),
      ];

      const entityCurrentValuesMap = new Map([
        ['current1', 'Current Label 1'],
        ['current2', 'Current Label 2'],
      ]);

      const entitySuggestedValuesMap = new Map([['suggested1', 'Suggested Label 1']]);

      const result = updateSuggestionValues(
        suggestions,
        entityCurrentValuesMap,
        entitySuggestedValuesMap
      );

      expect(result[0].currentValue).toEqual([
        { id: 'current1', label: 'Current Label 1' },
        { id: 'current2', label: 'Current Label 2' },
      ]);
      expect(result[0].suggestedValue).toEqual([{ id: 'suggested1', label: 'Suggested Label 1' }]);
    });

    it('should handle mixed value types', () => {
      const suggestions = [
        createMockSuggestion({
          currentValue: ['current1', { id: 'current2', label: 'Already Labeled' }],
          suggestedValue: ['suggested1'],
        }),
      ];

      const entityCurrentValuesMap = new Map([['current1', 'Current Label 1']]);
      const entitySuggestedValuesMap = new Map([['suggested1', 'Suggested Label 1']]);

      const result = updateSuggestionValues(
        suggestions,
        entityCurrentValuesMap,
        entitySuggestedValuesMap
      );

      expect(result[0].currentValue).toEqual([
        { id: 'current1', label: 'Current Label 1' },
        { id: 'current2', label: 'Already Labeled' },
      ]);
      expect(result[0].suggestedValue).toEqual([{ id: 'suggested1', label: 'Suggested Label 1' }]);
    });

    it('should handle empty values', () => {
      const suggestions = [
        createMockSuggestion({
          currentValue: [],
          suggestedValue: [],
        }),
      ];

      const entityCurrentValuesMap = new Map();
      const entitySuggestedValuesMap = new Map();

      const result = updateSuggestionValues(
        suggestions,
        entityCurrentValuesMap,
        entitySuggestedValuesMap
      );

      expect(result[0].currentValue).toEqual([]);
      expect(result[0].suggestedValue).toEqual([]);
    });
  });
});
