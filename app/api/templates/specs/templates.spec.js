/* eslint-disable max-statements */
import Ajv from 'ajv';
import documents from 'api/documents/documents.js';
import * as generatedIdPropertyAutoFiller from 'api/entities/generatedIdPropertyAutoFiller';
import translations from 'api/i18n/translations';
import { elasticClient } from 'api/search/elastic';
import db, { testingDB } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { propertyTypes } from 'shared/propertyTypes';

import { spyOnEmit } from 'api/eventsbus/eventTesting';

import { applicationEventsBus } from 'api/eventsbus';
import { testingTenants } from 'api/utils/testingTenants';
import { inspect } from 'util';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { TemplateDeletedEvent } from '../events/TemplateDeletedEvent';
import { TemplateUpdatedEvent } from '../events/TemplateUpdatedEvent';
import templates from '../templates';
import templatesModel from '../templatesModel';
import { denormalizeTemplateEntities } from '../templateUpdateDenormalizeUseCase';
import fixtures, {
  factory,
  propertyToBeInherited,
  relatedTo,
  relatedToAnother,
  swapTemplate,
  templateToBeDeleted,
  templateToBeEditedId,
  templateToBeInherited,
  templateWithContents,
  thesauriId1,
  thesaurusTemplate2Id,
  thesaurusTemplate3Id,
  thesaurusTemplateId,
  thesaurusTemplateRelationshipPropId,
} from './fixtures/fixtures';

jest.mock('../templateUpdateDenormalizeUseCase', () => ({
  denormalizeTemplateEntities: jest.fn().mockImplementation(async () => true),
}));

async function updateTemplate(template, language = 'en', updateV2 = false) {
  if (updateV2) {
    return templates.save(template, language, true, false);
  }
  return new Promise((resolve, reject) => {
    templates
      .save(template, language, true, false, async error => {
        if (error) {
          reject(inspect(error));
        }
        await templatesModel.db.updateOne({ _id: template._id }, { $unset: { processing: '' } });
        resolve();
      })
      .catch(reject);
  });
}

describe('templates', () => {
  const elasticIndex = 'templates_spec_index';

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, elasticIndex);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each([
    {
      title: 'Update v1',
      featureFlags: { v2UpdateTemplateUseCase: false },
    },
    { title: 'Update v2', featureFlags: { v2UpdateTemplateUseCase: true } },
  ])('$title', ({ featureFlags }) => {
    beforeEach(async () => {
      await testingEnvironment.setUp(fixtures, elasticIndex);
      testingTenants.mockCurrentTenant({
        name: testingDB.dbName,
        dbName: testingDB.dbName,
        indexName: elasticIndex,
        featureFlags,
      });
    });

    it('should edit an existing one', async () => {
      const toSave = await templates.getById(factory.id('template to be edited'));

      toSave.name = 'changed name';

      await templates.save(toSave, 'en');
      const [edited] = await templates.get(templateToBeEditedId);
      expect(edited.name).toBe('changed name');
    });

    it('should return the saved template', async () => {
      const edited = factory.template('', [], {
        _id: templateToBeEditedId,
        name: 'changed name',
      });
      const template1 = await templates.save(edited);
      await templatesModel.db.updateOne({ _id: template1._id }, { $unset: { processing: '' } });

      expect(template1.name).toBe('changed name');
    });

    it('should emit an TemplateUpdatedEvent', async () => {
      const template = factory.template(
        'template to be edited',
        [
          {
            name: 'other_prop',
            label: 'other prop',
            type: 'text',
          },
        ],
        {
          name: 'template to be edited',
          default: true,
        }
      );

      const [previousTemplate] = await db.mongodb
        .collection('templates')
        .find({ _id: templateToBeEditedId })
        .toArray();

      let emitedEventData;
      applicationEventsBus.on(TemplateUpdatedEvent, data => {
        emitedEventData = data;
      });
      await updateTemplate(template, 'en', featureFlags.v2UpdateTemplateUseCase);

      const [currentTemplate] = await db.mongodb
        .collection('templates')
        .find({ _id: templateToBeEditedId })
        .toArray();

      expect(emitedEventData.before._id.toString()).toEqual(previousTemplate._id.toString());
      expect(emitedEventData.before.properties).toMatchObject([]);

      expect(emitedEventData.after._id.toString()).toEqual(currentTemplate._id.toString());
      expect(emitedEventData.after.properties).toMatchObject([
        { name: 'other_prop', label: 'other prop', type: 'text' },
      ]);
    });

    it('should not allow to swap property names', async () => {
      const changedTemplate = {
        _id: swapTemplate,
        name: 'swap names template',
        commonProperties: [
          {
            _id: factory.id('swap names template title').toString(),
            name: 'title',
            label: 'Title',
            type: 'text',
            isCommonProperty: true,
          },
        ],
        properties: [
          { _id: factory.id('text_id'), type: 'text', name: 'text', label: 'Select5' },
          {
            _id: factory.id('select_id'),
            type: 'select',
            name: 'select5',
            label: 'Text',
            content: thesauriId1.toString(),
          },
        ],
      };

      try {
        await templates.save(changedTemplate);
        throw new Error('properties have swaped names, should have failed with an error');
      } catch (error) {
        expect(error.message).toContain("Properties can't swap names");
      }
    });

    it('should update the elastic mapping with the updated template', async () => {
      const template = factory.template(
        '',
        [
          {
            name: 'new_mapped_prop',
            label: 'new mapped prop',
            type: 'text',
          },
        ],
        {
          _id: templateToBeEditedId,
          name: 'template to be edited',
          default: true,
        }
      );

      const mapping = await elasticClient.indices.getMapping({ index: elasticIndex });

      await templates.save(template);

      await elasticClient.indices.refresh({ index: elasticIndex });

      const newMapping = await elasticClient.indices.getMapping({ index: elasticIndex });

      expect(
        mapping.body[elasticIndex].mappings.properties.metadata.properties.new_mapped_prop
      ).toBeUndefined();

      expect(
        newMapping.body[elasticIndex].mappings.properties.metadata.properties.new_mapped_prop
      ).toBeDefined();
    });

    it('should update translations when name of the template changes', async () => {
      const newTemplate = factory.template('new template', []);
      delete newTemplate._id;
      const testTemplate = await templates.save(newTemplate);

      testTemplate.name = 'changed name';
      await templates.save(testTemplate);

      const dbTranslations = await DefaultTranslationsDataSource(DefaultTransactionManager())
        .getContextAndKeys(testTemplate._id.toString(), ['changed name', 'new template'])
        .all();

      expect(dbTranslations.find(t => t.key === 'new template')).toBeFalsy();
      expect(dbTranslations.find(t => t.key === 'changed name')).toBeTruthy();
    });

    it('should update translations with the name of the title property, and remove old custom value', async () => {
      const testTemplate = factory.template('template to be edited');
      testTemplate.commonProperties[0].label = 'First New Title';
      await templates.save(testTemplate);

      testTemplate.commonProperties[0].label = 'Second New Title';
      await templates.save(testTemplate);

      const dbTranslations = await DefaultTranslationsDataSource(DefaultTransactionManager())
        .getContextAndKeys(testTemplate._id.toString(), ['First New Title', 'Second New Title'])
        .all();

      expect(dbTranslations.find(t => t.key === 'First New Title')).toBeFalsy();
      expect(dbTranslations.find(t => t.key === 'Second New Title')).toBeTruthy();
    });

    it('should update the translation context for it', async () => {
      const newTemplate = {
        name: 'created template',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text', isCommonProperty: true }],
        properties: [
          { label: 'label 1', type: 'text' },
          { label: 'label 2', type: 'text' },
        ],
      };
      const template1 = await templates.save(newTemplate);
      let dbTranslations = await DefaultTranslationsDataSource(DefaultTransactionManager())
        .getAll()
        .all();
      expect(dbTranslations.find(t => t.key === 'created template')).toBeTruthy();
      expect(dbTranslations.find(t => t.key === 'Title')).toBeTruthy();
      expect(dbTranslations.find(t => t.key === 'label 1')).toBeTruthy();
      expect(dbTranslations.find(t => t.key === 'label 2')).toBeTruthy();

      template1.name = 'new template title';
      template1.properties[0].label = 'new label 1';
      template1.properties.pop();
      template1.properties.push({ label: 'label 3', type: 'text' });
      template1.commonProperties[0].label = 'new title label';
      await templates.save(template1);

      dbTranslations = await DefaultTranslationsDataSource(DefaultTransactionManager())
        .getAll()
        .all();

      expect(dbTranslations.find(t => t.key === 'created template')).toBeFalsy();
      expect(dbTranslations.find(t => t.key === 'new template title')).toBeTruthy();

      expect(dbTranslations.find(t => t.key === 'Title')).toBeFalsy();
      expect(dbTranslations.find(t => t.key === 'new title label')).toBeTruthy();

      expect(dbTranslations.find(t => t.key === 'label 1')).toBeFalsy();
      expect(dbTranslations.find(t => t.key === 'new label 1')).toBeTruthy();

      expect(dbTranslations.find(t => t.key === 'label 2')).toBeFalsy();

      expect(dbTranslations.find(t => t.key === 'label 3')).toBeTruthy();
    });

    it('should update translations handling duplicate values properly', async () => {
      const newTemplate = {
        name: 'Country',
        commonProperties: [
          { name: 'title', label: 'Country', type: 'text', isCommonProperty: true },
        ],
        properties: [],
      };
      // eslint-disable-next-line no-unused-vars
      const template1 = await templates.save(newTemplate);
      const dbTranslations = await DefaultTranslationsDataSource(DefaultTransactionManager())
        .getAll()
        .all();

      expect(dbTranslations.filter(t => t.key === 'Country' && t.language === 'en').length).toBe(1);

      // template1.commonProperties[0].label = 'Country name';
      // await templates.save(template1);
      //
      // dbTranslations = await DefaultTranslationsDataSource(DefaultTransactionManager())
      //   .getAll()
      //   .all();
      //
      // expect(dbTranslations.filter(t => t.key === 'Country' && t.language === 'en').length).toBe(1);
      // expect(
      //   dbTranslations.filter(t => t.key === 'Country name' && t.language === 'en').length
      // ).toBe(1);
      //
      // template1.commonProperties[0].label = 'Country';
      // await templates.save(template1);
      //
      // dbTranslations = await DefaultTranslationsDataSource(DefaultTransactionManager())
      //   .getAll()
      //   .all();
      //
      // expect(dbTranslations.filter(t => t.key === 'Country' && t.language === 'en').length).toBe(1);
      // expect(
      //   dbTranslations.filter(t => t.key === 'Country name' && t.language === 'en').length
      // ).toBe(0);
      //
      // template1.name = 'Country template';
      // await templates.save(template1);
      //
      // dbTranslations = await DefaultTranslationsDataSource(DefaultTransactionManager())
      //   .getAll()
      //   .all();
      //
      // expect(dbTranslations.filter(t => t.key === 'Country' && t.language === 'en').length).toBe(1);
      // expect(
      //   dbTranslations.filter(t => t.key === 'Country template' && t.language === 'en').length
      // ).toBe(1);
    });
  });

  xdescribe('save', () => {
    describe('generatedId', () => {
      let populateGeneratedIdByTemplateSpy;
      beforeEach(() => {
        populateGeneratedIdByTemplateSpy = jest
          .spyOn(generatedIdPropertyAutoFiller, 'populateGeneratedIdByTemplate')
          .mockImplementation(() => Promise.resolve());
      });

      afterEach(() => {
        populateGeneratedIdByTemplateSpy.mockReset();
      });

      describe('when there is a new property with generatedId type', () => {
        it('should call populateGeneratedIdBTemplate to auto-fill values', async () => {
          const templateToUpdate = factory.template(
            '',
            [{ name: 'autoId', type: propertyTypes.generatedid, label: 'Auto Id' }],
            {
              _id: templateToBeEditedId,
              name: 'template to be edited',
            }
          );

          await updateTemplate(templateToUpdate);

          expect(populateGeneratedIdByTemplateSpy).toHaveBeenCalledWith(
            templateToBeEditedId,
            templateToUpdate.properties
          );
        });
      });
      describe('when there are no new properties with generatedId type', () => {
        it('should not call populateGeneratedIdBTemplate to auto-fill values', async () => {
          const [storedTemplate] = await templates.get({ _id: templateWithContents });
          await templates.save(storedTemplate, 'en');
          expect(populateGeneratedIdByTemplateSpy).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe.each([
    {
      title: 'Create v1',
      featureFlags: { v2CreateTemplateUseCase: false },
    },
    { title: 'Create v2', featureFlags: { v2CreateTemplateUseCase: true } },
  ])('$title', ({ featureFlags }) => {
    beforeEach(async () => {
      await testingEnvironment.setFixtures(fixtures);
      testingTenants.mockCurrentTenant({
        name: testingDB.dbName,
        dbName: testingDB.dbName,
        indexName: elasticIndex,
        featureFlags,
      });
    });

    afterEach(async () => {
      jest.resetAllMocks();
    });

    it('should return the saved template', async () => {
      const newTemplate = {
        name: 'created_template',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text', isCommonProperty: true }],
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
        commonProperties: [{ name: 'title', label: 'Title', type: 'text', isCommonProperty: true }],
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
        commonProperties: [{ name: 'title', label: 'Title', type: 'text', isCommonProperty: true }],
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
        commonProperties: [{ name: 'title', label: 'Title', type: 'text', isCommonProperty: true }],
      };
      await templates.save(newTemplate);

      const [newCreatedTemplate] = await templates.get({ name: 'new template default properties' });
      expect(newCreatedTemplate.properties).toEqual([]);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await testingEnvironment.setUp(fixtures, elasticIndex);
    });

    it('should delete properties of other templates using this template as select/relationship', async () => {
      await templates.delete({ _id: templateToBeDeleted });

      const [template1] = await templates.get({ name: 'thesauri template' });
      expect(template1.properties.length).toBe(1);
      expect(template1.properties[0].label).toBe('select');

      const [template2] = await templates.get({ name: 'thesauri template 2' });
      expect(template2.properties.length).toBe(1);
      expect(template2.properties[0].label).toBe('select2');

      const [template3] = await templates.get({ name: 'thesauri template 3' });
      expect(template3.properties.length).toBe(2);
      expect(template3.properties[0].label).toBe('text');
      expect(template3.properties[1].label).toBe('text2');
    });

    it('should remove the related metadata from entities using this template as a select/relationship, from all languages', async () => {
      await templates.delete({ _id: templateToBeDeleted });
      const relatedEntities = await db.mongodb
        .collection('entities')
        .find({
          template: { $in: [thesaurusTemplateId, thesaurusTemplate2Id, thesaurusTemplate3Id] },
        })
        .sort({ title: 1 })
        .toArray();

      const titles = relatedEntities.map(e => e.title);
      expect(titles).toEqual([
        't1-1_en',
        't1-1_es',
        't1-1_pt',
        't1-2_en',
        't1-2_es',
        't1-2_pt',
        't1-3_en',
        't1-3_es',
        't1-3_pt',
        't2-1_en',
        't2-1_es',
        't2-1_pt',
      ]);
      ['en', 'es', 'pt'].forEach(l => {
        const metadatas = relatedEntities.filter(e => e.language === l).map(e => e.metadata);
        expect(metadatas).toMatchObject([
          { select: [] },
          { select: [] },
          { select: [] },
          { select2: [] },
        ]);
      });
    });

    it('should delete a template when no document is using it', async () => {
      jest.spyOn(templates, 'countByTemplate').mockImplementation(async () => Promise.resolve(0));

      const response = await templates.delete({ _id: templateToBeDeleted });
      expect(response).toEqual({ _id: templateToBeDeleted });

      const allTemplates = await templates.get();
      const deleted = allTemplates.find(template1 => template1.name === 'to be deleted');

      expect(deleted).not.toBeDefined();
    });

    it('should delete the template translation', async () => {
      jest.spyOn(documents, 'countByTemplate').mockImplementation(async () => Promise.resolve(0));
      jest.spyOn(translations, 'deleteContext').mockImplementation(async () => Promise.resolve());

      await templates.delete({ _id: templateToBeDeleted });
      expect(translations.deleteContext).toHaveBeenCalledWith(templateToBeDeleted);
    });

    it(`should emit a ${TemplateDeletedEvent.name} event`, async () => {
      const emitSpy = spyOnEmit();

      await templates.delete({ _id: templateToBeDeleted });

      emitSpy.expectToEmitEvent(TemplateDeletedEvent, { template: templateToBeDeleted });
    });

    it('should throw an error when there is documents using it', async () => {
      jest.spyOn(templates, 'countByTemplate').mockImplementation(async () => Promise.resolve(1));
      try {
        await templates.delete({ _id: templateToBeDeleted });
        throw new Error(
          'should not delete the template and throw an error because there is some documents associated with the template'
        );
      } catch (error) {
        expect(error.message).toBeUndefined();
        expect(error.key).toEqual('documents_using_template');
        expect(error.value).toEqual(1);
      }
    });

    it('should handle a non existing template', async () => {
      try {
        await templates.delete({ _id: new ObjectId().toString() });
      } catch (error) {
        throw new Error(
          'should not delete the template and throw an error because it is the default template'
        );
      }
    });

    it('should throw an error when the template is the default template', async () => {
      try {
        await templates.delete({ _id: templateToBeEditedId });
        throw new Error(
          'should not delete the template and throw an error because it is the default template'
        );
      } catch (error) {
        expect(error.message).toEqual(
          'Validation error\n{"path":"_id","message":"default_template_cannot_be_deleted"}'
        );
      }
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

  describe('setAsDefault()', () => {
    it('should set the given ID as the default template and return the afected templates', async () => {
      const [newDefault, oldDefault] = await templates.setAsDefault(
        templateWithContents.toString()
      );

      expect(newDefault.name).toBe('content template');
      expect(newDefault.default).toBe(true);
      expect(oldDefault.name).toBe('template to be edited');
      expect(oldDefault.default).toBe(false);
    });

    it("should fail if id doesn't exist", async () => {
      try {
        await templates.setAsDefault(propertyToBeInherited);
        fail('it should not pass');
      } catch (err) {
        expect(err.message).toContain('Invalid ID');
      }
    });
  });

  describe('getPropertyByName()', () => {
    it('should get properties with the name provided', async () => {
      const newTemplate = {
        name: 'created template 2',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          { label: 'label', type: 'text' },
          { label: 'Date', type: 'date' },
        ],
      };
      await templates.save(newTemplate);
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
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          { label: 'label', type: 'text' },
          { label: 'Date', type: 'date' },
        ],
      };
      const newTemplate2 = {
        name: 'created template 4',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [{ label: 'number', type: 'numeric' }],
      };
      await templates.save(newTemplate);
      await templates.save(newTemplate2);
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
      savedTemplate = await templates.save({
        name: 'template inherit',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          {
            type: propertyTypes.relationship,
            content: templateToBeInherited.toString(),
            relationType: relatedTo.toString(),
            name: 'new inherit',
            label: 'New Inherit',
            inherit: {
              property: propertyToBeInherited.toString(),
              type: 'this should not be saved',
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
        commonProperties: [{ name: 'title', type: 'text' }],
        properties: [{ label: 'Select', type: 'select' }],
      };
      try {
        await templates.save(tpl, 'en');
        fail('should throw validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(Ajv.ValidationError);
        expect(error.errors.some(e => e.params.missingProperty === 'label')).toBe(true);
        expect(error.errors.some(e => e.keyword === 'requireOrInvalidContentForSelectFields')).toBe(
          true
        );
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

  describe('denormalizeTemplateEntities', () => {
    it('should not denormalize when relationship related data has not changed', async () => {
      await testingEnvironment.setUp(fixtures, elasticIndex);
      const template = {
        _id: templateToBeEditedId,
        name: 'template to be edited',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          {
            name: 'new_mapped_prop',
            label: 'new mapped prop',
            type: 'text',
          },
        ],
        default: true,
      };

      denormalizeTemplateEntities.mockReset();
      await templates.save(template);
      expect(denormalizeTemplateEntities).not.toHaveBeenCalled();
    });

    it.each([
      { propChanges: { content: 'NEW CONTENT' } },
      { propChanges: { inherit: { property: thesaurusTemplateRelationshipPropId.toString() } } },
      { propChanges: { relationType: relatedToAnother.toString() } },
      { propChanges: { relationType: relatedToAnother.toString(), content: 'New Content' } },
    ])(
      'should denormalize when relationship related data has changed ($propChanges)',
      async ({ propChanges }) => {
        await testingEnvironment.setUp(fixtures, elasticIndex);
        const template = factory.template(
          '',
          [
            {
              _id: thesaurusTemplateRelationshipPropId,
              type: propertyTypes.relationship,
              relationType: relatedTo.toString(),
              content: templateToBeDeleted,
              label: 'relationshipToBeDeleted',
              name: 'relationshipToBeDeleted',
              ...propChanges,
            },
          ],
          {
            _id: thesaurusTemplateId,
            name: 'thesauri template',
          }
        );

        denormalizeTemplateEntities.mockReset();
        await new Promise((resolve, reject) => {
          templates.save(template, 'en', false, false, e => {
            if (e) {
              reject(e);
            }
            resolve();
          });
        });
        expect(denormalizeTemplateEntities).toHaveBeenCalled();
      }
    );
  });
});
