/**
 * @jest-environment jsdom
 */

import { ClientEntitySchema, ClientPropertySchema } from 'app/istore';
import { TemplateSchema } from 'shared/types/templateType';
import {
  getPropertyNameFromExtractPair,
  getTemplateFromExtractPair,
  handleEntitySave,
} from '../sidepanelFunctions';

jest.mock('V2/api/entities', () => ({
  formatter: {
    update: jest.fn().mockImplementation((entity, data) => ({ ...entity, ...data })),
  },
  save: jest.fn().mockResolvedValue({ success: true }),
}));

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
});
