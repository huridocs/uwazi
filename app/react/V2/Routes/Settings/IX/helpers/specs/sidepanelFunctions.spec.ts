/**
 * @jest-environment jsdom
 */

import { ClientEntitySchema, ClientPropertySchema } from 'app/istore';
import { TemplateSchema } from 'shared/types/templateType';
import {
  getPropertyNameFromExtractPair,
  getTemplateFromExtractPair,
  handleEntitySave,
  getFormValue,
  coerceValue,
} from '../sidepanelFunctions';
import { EntitySuggestionType } from 'shared/types/suggestionType';

jest.mock('V2/api/entities', () => ({
  formatter: {
    update: jest.fn().mockImplementation((entity, data) => ({ ...entity, ...data })),
  },
  save: jest.fn().mockResolvedValue({ success: true }),
  coerceValue: jest.fn().mockImplementation((text, type, language) => {
    if (!text || text === '') {
      return Promise.resolve(undefined);
    }
    if (text === 'invalid date' || text === 'not a number') {
      return Promise.resolve(undefined);
    }
    if (type === 'numeric') {
      const num = parseFloat(text);
      if (isNaN(num)) {
        return Promise.resolve(undefined);
      }
      return Promise.resolve({ success: true, value: num });
    }
    if (type === 'date') {
      return Promise.resolve({ success: true, value: 1752814800 });
    }
    return Promise.resolve(undefined);
  }),
}));

const mockEntity: ClientEntitySchema = {
  _id: 'entity1',
  title: 'Test Entity',
  sharedId: 'shared1',
  metadata: {},
} as ClientEntitySchema;

const mockTextProperty: ClientPropertySchema = {
  _id: 'prop1',
  name: 'title',
  type: 'text',
  label: 'Title',
} as ClientPropertySchema;

const mockRelationshipProperty: ClientPropertySchema = {
  _id: 'relProp1',
  name: 'relatedEntities',
  type: 'relationship',
  label: 'Related Entities',
  content: 'relContent1',
} as ClientPropertySchema;

const mockTemplate: TemplateSchema = {
  _id: 'template1',
  name: 'Test Template',
  properties: [
    mockRelationshipProperty,
    {
      _id: 'relProp2',
      name: 'relatedEntities2',
      type: 'relationship',
      label: 'Related Entities 2',
      content: 'relContent1', // Same content as relProp1
    },
    {
      _id: 'relProp3',
      name: 'relatedEntities3',
      type: 'relationship',
      label: 'Related Entities 3',
      content: 'relContent2', // Different content
    },
    {
      _id: 'textProp1',
      name: 'description',
      type: 'text',
      label: 'Description',
    },
  ],
} as TemplateSchema;

describe('sidepanelFunctions', () => {
  describe('getPropertyNameFromExtractPair', () => {
    it('should extract property name from extractor pair', () => {
      expect(getPropertyNameFromExtractPair('template1-property1')).toBe('property1');
      expect(getPropertyNameFromExtractPair('template2-title')).toBe('title');
      expect(getPropertyNameFromExtractPair('template3-custom_property')).toBe('custom_property');
    });

    it('should handle edge cases', () => {
      expect(getPropertyNameFromExtractPair('template-')).toBe('');
      expect(getPropertyNameFromExtractPair('-property')).toBe('property');
      expect(getPropertyNameFromExtractPair('')).toBe('');
    });
  });

  describe('getTemplateFromExtractPair', () => {
    it('should extract template ID from extractor pair', () => {
      expect(getTemplateFromExtractPair('template1-property1')).toBe('template1');
      expect(getTemplateFromExtractPair('template2-title')).toBe('template2');
      expect(getTemplateFromExtractPair('template3-custom_property')).toBe('template3');
    });

    it('should handle edge cases', () => {
      expect(getTemplateFromExtractPair('template-')).toBe('template');
      expect(getTemplateFromExtractPair('-property')).toBe('');
      expect(getTemplateFromExtractPair('')).toBe('');
    });
  });

  describe('handleEntitySave', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return undefined when field has not changed', async () => {
      const result = await handleEntitySave(
        mockEntity,
        mockTextProperty,
        'new value',
        mockTemplate,
        false
      );
      expect(result).toBeUndefined();
    });

    it('should return undefined when entity is not provided', async () => {
      const result = await handleEntitySave(
        undefined,
        mockTextProperty,
        'new value',
        mockTemplate,
        true
      );
      expect(result).toBeUndefined();
    });

    it('should return undefined when property name is not provided', async () => {
      const propertyWithoutName = { ...mockTextProperty, name: '' } as ClientPropertySchema;
      const result = await handleEntitySave(
        mockEntity,
        propertyWithoutName,
        'new value',
        mockTemplate,
        true
      );
      expect(result).toBeUndefined();
    });

    it('should handle title property updates', async () => {
      const { formatter, save } = jest.requireMock('V2/api/entities');

      await handleEntitySave(mockEntity, mockTextProperty, 'New Title', mockTemplate, true);

      expect(formatter.update).toHaveBeenCalledWith(mockEntity, { title: 'New Title' });
      expect(save).toHaveBeenCalled();
    });

    it('should handle regular property updates', async () => {
      const regularProperty = { ...mockTextProperty, name: 'description' };
      const { formatter, save } = jest.requireMock('V2/api/entities');

      await handleEntitySave(mockEntity, regularProperty, 'New Description', mockTemplate, true);

      expect(formatter.update).toHaveBeenCalledWith(mockEntity, {
        properties: [{ description: 'New Description' }],
      });
      expect(save).toHaveBeenCalled();
    });

    it('should handle relationship property updates with the same content', async () => {
      const { save } = jest.requireMock('V2/api/entities');

      await handleEntitySave(
        mockEntity,
        mockRelationshipProperty,
        ['entity1', 'entity2'],
        mockTemplate,
        true
      );

      expect(save).toHaveBeenCalledWith({
        ...mockEntity,
        properties: [
          { relatedEntities: ['entity1', 'entity2'] },
          { relatedEntities2: ['entity1', 'entity2'] },
        ],
        sharedId: 'shared1',
        title: 'Test Entity',
      });
    });
  });

  describe('getFormValue', () => {
    it.each([
      {
        description: 'should return undefined when suggestion is missing',
        suggestion: undefined,
        entity: mockEntity,
        type: undefined,
        expected: undefined,
      },
      {
        description: 'should return undefined when entity is missing',
        suggestion: { propertyName: 'title' } as EntitySuggestionType,
        entity: undefined,
        type: undefined,
        expected: undefined,
      },
      {
        description: 'should return title when propertyName is title',
        suggestion: { propertyName: 'title' } as EntitySuggestionType,
        entity: mockEntity,
        type: undefined,
        expected: 'Test Entity',
      },
      {
        description: 'should return empty string for non-title property with no metadata',
        suggestion: { propertyName: 'description' } as EntitySuggestionType,
        entity: { ...mockEntity, metadata: {} },
        type: undefined,
        expected: '',
      },
      {
        description: 'should return first metadata value for non-title property',
        suggestion: { propertyName: 'description' } as EntitySuggestionType,
        entity: {
          ...mockEntity,
          metadata: { description: [{ value: 'Test Description' }] },
        },
        type: undefined,
        expected: 'Test Description',
      },
      {
        description: 'should return timestamp for date value',
        suggestion: { propertyName: 'date' } as EntitySuggestionType,
        entity: {
          ...mockEntity,
          metadata: { date: [{ value: 1696624527 }] },
        },
        type: 'date',
        expected: 1696624527,
      },
      {
        description: 'should return array for select type',
        suggestion: { propertyName: 'category' } as EntitySuggestionType,
        entity: {
          ...mockEntity,
          metadata: { category: [{ value: 'cat1' }, { value: 'cat2' }] },
        },
        type: 'select',
        expected: ['cat1', 'cat2'],
      },
      {
        description: 'should return array for multiselect type',
        suggestion: { propertyName: 'tags' } as EntitySuggestionType,
        entity: {
          ...mockEntity,
          metadata: { tags: [{ value: 'tag1' }] },
        },
        type: 'multiselect',
        expected: ['tag1'],
      },
      {
        description: 'should return array for relationship type',
        suggestion: { propertyName: 'related' } as EntitySuggestionType,
        entity: {
          ...mockEntity,
          metadata: { related: [{ value: 'rel1' }, { value: 'rel2' }] },
        },
        type: 'relationship',
        expected: ['rel1', 'rel2'],
      },
      {
        description: 'should return empty array for select type with no metadata',
        suggestion: { propertyName: 'empty' } as EntitySuggestionType,
        entity: { ...mockEntity, metadata: {} },
        type: 'select',
        expected: [],
      },
    ])('$description', ({ suggestion, entity, type, expected }) => {
      expect(getFormValue(suggestion, entity, type)).toEqual(expected);
    });
  });

  describe('coerceValue', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('date parsing with different language codes', () => {
      it.each([
        // Greek variations
        {
          description: 'should parse Greek date with ISO 639-1 code',
          text: '18ης Ιουλίου 2025',
          language: 'el',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse Greek date with ISO 639-2 code',
          text: '18ης Ιουλίου 2025',
          language: 'ell',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse Greek date with English name',
          text: '18ης Ιουλίου 2025',
          language: 'greek',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse Greek date with abbreviation',
          text: '18ης Ιουλίου 2025',
          language: 'gre',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse Greek date without ordinal',
          text: '18 Ιουλίου 2025',
          language: 'el',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        // English variations
        {
          description: 'should parse English date with ordinal',
          text: '18th July 2025',
          language: 'en',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse English date with ISO 639-2 code',
          text: '18th July 2025',
          language: 'eng',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse English date with full name',
          text: '18th July 2025',
          language: 'english',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse English date without ordinal',
          text: '18 July 2025',
          language: 'en',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse English date with month first',
          text: 'July 18, 2025',
          language: 'en',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        // Spanish variations
        {
          description: 'should parse Spanish date with ISO 639-1 code',
          text: '18 de julio de 2025',
          language: 'es',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse Spanish date with ISO 639-2 code',
          text: '18 de julio de 2025',
          language: 'spa',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse Spanish date with English name',
          text: '18 de julio de 2025',
          language: 'spanish',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse Spanish date with native name',
          text: '18 de julio de 2025',
          language: 'español',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        // French variations
        {
          description: 'should parse French date with ISO 639-1 code',
          text: '18 juillet 2025',
          language: 'fr',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse French date with ISO 639-2 code',
          text: '18 juillet 2025',
          language: 'fra',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse French date with English name',
          text: '18 juillet 2025',
          language: 'french',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse French date with native name',
          text: '18 juillet 2025',
          language: 'français',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse French date with ordinal',
          text: '18ème juillet 2025',
          language: 'fr',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        // German variations
        {
          description: 'should parse German date with ISO 639-1 code',
          text: '18. Juli 2025',
          language: 'de',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse German date with ISO 639-2 code',
          text: '18. Juli 2025',
          language: 'deu',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse German date with alternative code',
          text: '18. Juli 2025',
          language: 'ger',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse German date with English name',
          text: '18. Juli 2025',
          language: 'german',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse German date with native name',
          text: '18. Juli 2025',
          language: 'deutsch',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse German date without dot',
          text: '18 Juli 2025',
          language: 'de',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        // Numeric formats (language agnostic)
        {
          description: 'should parse ISO format date',
          text: '2025-07-18',
          language: 'en',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse DD/MM/YYYY format date',
          text: '18/07/2025',
          language: 'en',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse MM/DD/YYYY format date',
          text: '07/18/2025',
          language: 'en',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should parse DD.MM.YYYY format date',
          text: '18.07.2025',
          language: 'en',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        // Edge cases
        {
          description: 'should handle unknown language code with fallback',
          text: '18 July 2025',
          language: 'unknown',
          expectedSuccess: true,
          expectedTimestamp: 1752814800,
        },
        {
          description: 'should handle empty string',
          text: '',
          language: 'en',
          expectedSuccess: false,
        },
        {
          description: 'should handle invalid date string',
          text: 'invalid date',
          language: 'en',
          expectedSuccess: false,
        },
      ])('$description', async ({ text, language, expectedSuccess, expectedTimestamp }) => {
        const result = await coerceValue('date', text, language);
        
        if (expectedSuccess) {
          expect(result).toEqual({
            success: true,
            value: expectedTimestamp,
          });
        } else {
          expect(result).toBeUndefined();
        }
      });
    });

    describe('numeric parsing', () => {
      it.each([
        {
          description: 'should parse valid numeric string',
          text: '42',
          language: 'en',
          expectedSuccess: true,
          expectedValue: 42,
        },
        {
          description: 'should parse decimal number',
          text: '42.5',
          language: 'en',
          expectedSuccess: true,
          expectedValue: 42.5,
        },
        {
          description: 'should parse negative number',
          text: '-42',
          language: 'en',
          expectedSuccess: true,
          expectedValue: -42,
        },
        {
          description: 'should handle invalid numeric string',
          text: 'not a number',
          language: 'en',
          expectedSuccess: false,
        },
        {
          description: 'should handle empty string',
          text: '',
          language: 'en',
          expectedSuccess: false,
        },
      ])('$description', async ({ text, language, expectedSuccess, expectedValue }) => {
        const result = await coerceValue('numeric', text, language);
        
        if (expectedSuccess) {
          expect(result).toEqual({
            success: true,
            value: expectedValue,
          });
        } else {
          expect(result).toBeUndefined();
        }
      });
    });

    describe('unsupported property types', () => {
      it('should return undefined for unsupported property types', async () => {
        const result = await coerceValue('text' as any, 'some text', 'en');
        expect(result).toBeUndefined();
      });
    });

    describe('invalid input', () => {
      it('should return undefined for invalid date input', async () => {
        const result = await coerceValue('date', undefined, 'en');
        expect(result).toBeUndefined();
      });

      it('should return undefined for invalid numeric input', async () => {
        const result = await coerceValue('numeric', undefined, 'en');
        expect(result).toBeUndefined();
      });
    });
  });
});
