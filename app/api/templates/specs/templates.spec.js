/* eslint-disable max-statements */
import db, { testingDB } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import * as idGenerator from 'shared/IDGenerator';
import { propertyTypes } from 'shared/propertyTypes';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { FieldIsRequiredError } from 'api/core/domain/template/errors';
import { TemplateFacade } from 'api/core/infrastructure/facades/TemplateFacade';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import templates from '../templates';
import fixtures, {
  propertyToBeInherited,
  relatedTo,
  swapTemplate,
  templateToBeInherited,
  thesauriId1,
} from './fixtures/fixtures';

describe('templates', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, true);
  });
  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('Create', () => {
    beforeEach(async () => {
      await testingEnvironment.setFixtures(fixtures);
    });

    it('should return the saved template', async () => {
      const newTemplate = {
        name: 'created_template',
        commonProperties: [
          { name: 'title', label: 'Title', type: 'text', isCommonProperty: true },
          { _id: db.id(), name: 'creationDate', label: 'Creation Date', type: 'date' },
          { _id: db.id(), name: 'editDate', label: 'Edit date', type: 'date' },
        ],
        properties: [
          { label: 'fieldLabel', type: 'text' },
          {
            label: 'Generated ID new ',
            type: 'generatedid',
          },
        ],
      };

      const template = await templates.save(newTemplate);
      expect(template._id).toBeDefined();
      expect(template.name).toBe('created_template');
      expect(template.properties[0].label).toEqual('fieldLabel');
    });

    it('should validate after generating property names', async () => {
      const newTemplate = {
        name: 'newTemplate',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text', isCommonProperty: true }],
        properties: [
          { label: 'field label', type: 'text' },
          { label: 'field_label', type: 'text' },
        ],
      };

      await expect(templates.save(newTemplate)).rejects.toHaveProperty('errors', [
        expect.objectContaining({ keyword: 'uniquePropertyFields' }),
      ]);
    });

    it('should add it to translations with Entity type', async () => {
      const newTemplate = {
        name: 'created template',
        commonProperties: [
          { name: 'title', label: 'Title', type: 'text', isCommonProperty: true },
          { _id: db.id(), name: 'creationDate', label: 'Creation Date', type: 'date' },
          { _id: db.id(), name: 'editDate', label: 'Edit date', type: 'date' },
        ],
        properties: [
          { label: 'label 1', type: 'text' },
          { label: 'label 2', type: 'text' },
        ],
      };

      const response = await templates.save(newTemplate);

      const dbTranslations = await DefaultTranslationsDataSource(DefaultTransactionManager())
        .getContextAndKeys(response._id.toString(), [
          'created template',
          'Title',
          'label 1',
          'label 2',
        ])
        .all();

      expect(dbTranslations.find(t => t.key === 'created template')).toBeTruthy();
      expect(dbTranslations.find(t => t.key === 'Title')).toBeTruthy();
      expect(dbTranslations.find(t => t.key === 'label 1')).toBeTruthy();
      expect(dbTranslations.find(t => t.key === 'label 2')).toBeTruthy();
    });

    it('should assign a safe property name based on the label ', async () => {
      const newTemplate = {
        name: 'new template',
        commonProperties: [
          { name: 'title', label: 'Title', type: 'text', isCommonProperty: true },
          {
            _id: testingDB.id(),
            name: 'creationDate',
            label: 'creationDate',
            type: 'date',
            isCommonProperty: true,
          },
          {
            _id: testingDB.id(),
            name: 'editDate',
            label: 'editDate',
            type: 'date',
          },
        ],
        properties: [
          { label: 'new label 1', type: 'text' },
          { label: 'new label 2', type: 'select', content: thesauriId1.toString() },
          { label: 'new label 3', type: 'image' },
          { label: 'new label 4', type: 'text' },
          { label: 'new label 5', type: 'geolocation' },
        ],
      };

      await templates.save(newTemplate);
      const [createdTemplate] = await templates.get({ name: 'new template' });

      expect(createdTemplate.properties[0].name).toEqual('new_label_1');
      expect(createdTemplate.properties[1].name).toEqual('new_label_2');
      expect(createdTemplate.properties[2].name).toEqual('new_label_3');
      expect(createdTemplate.properties[3].name).toEqual('new_label_4');
      expect(createdTemplate.properties[4].name).toEqual('new_label_5_geolocation');
    });

    it('should set a default value of [] to properties', async () => {
      const newTemplate = {
        name: 'new template default properties',
        commonProperties: [
          { name: 'title', label: 'Title', type: 'text', isCommonProperty: true },
          {
            _id: testingDB.id(),
            name: 'creationDate',
            label: 'creationDate',
            type: 'date',
            isCommonProperty: true,
          },
          {
            _id: testingDB.id(),
            name: 'editDate',
            label: 'editDate',
            type: 'date',
          },
        ],
      };
      await templates.save(newTemplate);

      const [newCreatedTemplate] = await templates.get({ name: 'new template default properties' });
      expect(newCreatedTemplate.properties).toEqual([]);
    });
  });

  describe('countByThesauri()', () => {
    it('should return number of templates using a thesauri', async () => {
      const result = await templates.countByThesauri(thesauriId1.toString());

      expect(result).toBe(4);
    });

    it('should return zero when none is using it', async () => {
      const result = await templates.countByThesauri('not_used_relation');
      expect(result).toBe(0);
    });
  });

  describe('getPropertyByName()', () => {
    it('should get properties with the name provided', async () => {
      await TemplateFacade.createWithDefaultValues({
        name: 'created template 2',
        properties: [
          { label: 'label', type: 'text' },
          { label: 'Date', type: 'date' },
        ],
      });

      const property = await templates.getPropertyByName('date');
      expect(property.name).toEqual('date');
      expect(property.type).toEqual('date');
    });

    it('should throw an error when the property is not found', async () => {
      try {
        await templates.getPropertyByName('nonexistent property name');
      } catch (e) {
        expect(e.message).toEqual('Properties not found: nonexistent property name');
      }
    });
  });

  describe('getPropertiesByName()', () => {
    it('should get properties with the name provided', async () => {
      const newTemplate = {
        name: 'created template 3',
        properties: [
          { label: 'label', type: 'text' },
          { label: 'Date', type: 'date' },
        ],
      };
      const newTemplate2 = {
        name: 'created template 4',
        properties: [{ label: 'number', type: 'numeric' }],
      };

      await TemplateFacade.createWithDefaultValues(newTemplate);
      await TemplateFacade.createWithDefaultValues(newTemplate2);

      const properties = await templates.getPropertiesByName(['date', 'label', 'number', 'title']);

      expect(properties).toMatchObject([
        { name: 'title', type: 'text' },
        { name: 'label', type: 'text' },
        { name: 'date', type: 'date' },
        { name: 'number', type: 'numeric' },
      ]);
    });

    it('should throw an error when a property is not found', async () => {
      try {
        await templates.getPropertiesByName(['nonexistent property name']);
      } catch (e) {
        expect(e.message).toEqual('Properties not found: nonexistent property name');
      }
    });
  });

  describe('inherit', () => {
    let savedTemplate;
    beforeAll(async () => {
      savedTemplate = await TemplateFacade.createWithDefaultValues({
        name: 'template inherit',
        properties: [
          {
            type: propertyTypes.relationship,
            content: templateToBeInherited.toString(),
            relationType: relatedTo.toString(),
            name: 'new inherit',
            label: 'New Inherit',
            inherit: {
              property: propertyToBeInherited.toString(),
              type: 'text',
            },
          },
        ],
      });
    });

    it('should denormalize the inherited property type', async () => {
      expect(savedTemplate.properties).toEqual([
        expect.objectContaining({
          inherit: {
            property: propertyToBeInherited.toString(),
            type: 'text',
          },
        }),
      ]);
    });

    it('should remove denormalized type when removing inheritance', async () => {
      savedTemplate.properties[0].inherit.property = '';
      const resavedTemplate = await templates.save(savedTemplate, 'en', false);
      expect(resavedTemplate.properties[0].inherit).not.toBeDefined();
    });
  });

  describe('validation', () => {
    it('should validate on save', async () => {
      const tpl = {
        name: 'Test',
        properties: [{ label: 'Select', type: 'select' }],
      };

      try {
        await TemplateFacade.createWithDefaultValues(tpl, 'en');
        fail('should throw validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(FieldIsRequiredError);
      }
    });
  });

  describe('canDeleteProperty()', () => {
    it('should return false if the property is been inherited by others', async () => {
      const canDelete = await templates.canDeleteProperty(
        templateToBeInherited,
        propertyToBeInherited
      );
      expect(canDelete).toBe(false);
    });

    it('should be true for other properties', async () => {
      const canDelete = await templates.canDeleteProperty(swapTemplate, 'notMatchingId');
      expect(canDelete).toBe(true);
    });
  });
});
