/* eslint-disable max-statements */
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { propertyTypes } from 'shared/propertyTypes';

import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { FieldIsRequiredError } from 'api/core/domain/template/errors';
import { TemplateFacade } from 'api/core/infrastructure/facades/TemplateFacade';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { TemplateSchema } from 'api/migrations/migrations/143-parse-numeric-fields/types';
import templates from '../templates';
import fixtures, {
  factory,
  propertyToBeInherited,
  relatedTo,
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
      const { _id, ...newTemplate } = factory.template('created_template', [
        factory.property('fieldLabel'),
        factory.property('Generated_ID_new', 'generatedid'),
      ]);

      const template = await templates.save(newTemplate, 'en');
      expect(template._id).toBeDefined();
      expect(template.name).toBe('created_template');
      expect(template.properties[0].label).toEqual('fieldLabel');
    });

    it('should validate after generating property names', async () => {
      const { _id, ...newTemplate } = factory.template('newTemplate', [
        factory.property('field_label'),
        factory.property('field_label'),
      ]);

      await expect(templates.save(newTemplate, 'en')).rejects.toHaveProperty('errors', [
        expect.objectContaining({ keyword: 'uniquePropertyFields' }),
      ]);
    });

    it('should add it to translations with Entity type', async () => {
      const { _id, ...newTemplate } = factory.template('created template', [
        factory.property('label_1', 'text', { label: 'label 1' }),
        factory.property('label_2', 'text', { label: 'label 2' }),
      ]);

      const response = await templates.save(newTemplate, 'en');

      const dbTranslations = await DefaultTranslationsDataSource(
        TransactionManagerFactory.default()
      )
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
      const { _id, ...newTemplate } = factory.template('new template', [
        factory.property('new label 1', 'text'),
        factory.property('new label 2', 'select', { content: thesauriId1.toString() }),
        factory.property('new label 3', 'image'),
        factory.property('new label 4'),
        factory.property('new label 5', 'geolocation'),
      ]);

      await templates.save(newTemplate, 'en');
      const [createdTemplate] = await templates.get({ name: 'new template' });

      expect(createdTemplate.properties?.[0].name).toEqual('new_label_1');
      expect(createdTemplate.properties?.[1].name).toEqual('new_label_2');
      expect(createdTemplate.properties?.[2].name).toEqual('new_label_3');
      expect(createdTemplate.properties?.[3].name).toEqual('new_label_4');
      expect(createdTemplate.properties?.[4].name).toEqual('new_label_5_geolocation');
    });

    it('should set a default value of [] to properties', async () => {
      const { _id, ...newTemplate } = factory.template('new template default properties');
      await templates.save(newTemplate, 'en');

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
    let savedTemplate: TemplateSchema;
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
      savedTemplate.properties![0]!.inherit!.property = '';
      const resavedTemplate = await templates.save(savedTemplate, 'en', false);
      //@ts-ignore
      expect(resavedTemplate.properties?.[0].inherit).not.toBeDefined();
    });
  });

  describe('validation', () => {
    it('should validate on save', async () => {
      const tpl = {
        name: 'Test',
        properties: [{ label: 'Select', type: 'select' }],
      };

      try {
        await TemplateFacade.createWithDefaultValues(tpl);
        fail('should throw validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(FieldIsRequiredError);
      }
    });
  });
});
