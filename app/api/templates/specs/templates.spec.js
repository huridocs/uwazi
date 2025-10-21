/* eslint-disable max-statements */
import { elasticClient } from 'api/search/elastic';
import * as setupSockets from 'api/socketio/setupSockets';
import db, { testingDB } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import * as idGenerator from 'shared/IDGenerator';
import { propertyTypes } from 'shared/propertyTypes';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { FieldIsRequiredError } from 'api/core/domain/template/errors';
import { TemplateFacade } from 'api/core/infrastructure/facades/TemplateFacade';
import { TemplateUpdatedEvent } from '../../core/domain/template/events/TemplateUpdatedEvent';
import templates from '../templates';
import templatesModel from '../templatesModel';
import fixtures, {
  factory,
  propertyToBeInherited,
  relatedTo,
  swapTemplate,
  templateToBeEditedId,
  templateToBeInherited,
  templateWithContents,
  thesauriId1,
  thesaurusTemplateId,
} from './fixtures/fixtures';

async function updateTemplate(template, language = 'en') {
  jest.spyOn(setupSockets, 'emitToTenant').mockImplementation();
  return templates.save(template, language, true, false);
}

describe('templates', () => {
  const elasticIndex = 'templates_spec_index';

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, elasticIndex);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('Update', () => {
    beforeEach(async () => {
      await testingEnvironment.setUp(fixtures, elasticIndex);
      jest.spyOn(idGenerator, 'generateID').mockImplementation(() => 'generated_id');
    });

    afterEach(() => {
      applicationEventsBus.clear();
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
      await updateTemplate(template, 'en');

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
          { _id: factory.id('text_id'), type: 'text', name: 'text', label: 'Select to be swapped' },
          {
            _id: factory.id('select_id'),
            type: 'select',
            name: 'select5',
            label: 'Name to be swapped',
            content: thesauriId1.toString(),
          },
        ],
      };

      try {
        await templates.save(changedTemplate);
        throw new Error('properties have swaped names, should have failed with an error');
      } catch (error) {
        expect(error.message).toContain('Properties cannot swap names');
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

    describe('when there is a new property with generatedId type', () => {
      it('should call populateGeneratedIdBTemplate to auto-fill values', async () => {
        const templateToUpdate = factory.template(
          '',
          [{ name: 'auto_id', type: propertyTypes.generatedid, label: 'Auto Id' }],
          {
            _id: thesaurusTemplateId,
            name: 'thesauri template',
          }
        );

        await updateTemplate(templateToUpdate, 'en');

        const generatedIdEntities = (await testingEnvironment.db.getAllFrom('entities')).filter(
          e => e.metadata.auto_id
        );

        expect(generatedIdEntities.length).toBe(9);
        const generatedIds = generatedIdEntities.map(e => e.metadata.auto_id[0].value);
        expect(generatedIds).toEqual([
          'generated_id',
          'generated_id',
          'generated_id',
          'generated_id',
          'generated_id',
          'generated_id',
          'generated_id',
          'generated_id',
          'generated_id',
        ]);
      });
    });
  });

  describe('save', () => {
    xdescribe('generatedId', () => {
      let populateGeneratedIdByTemplateSpy;
      beforeEach(() => {
        jest.spyOn(idGenerator, 'generateID').mockImplementation(() => 'generated_id');
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

  describe('Create', () => {
    beforeEach(async () => {
      await testingEnvironment.setFixtures(fixtures);
    });

    afterEach(async () => {
      jest.resetAllMocks();
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
    beforeEach(async () => {
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

  // Todo

  // describe('denormalizeTemplateEntities', () => {
  //   jest.spyOn(setupSockets, 'emitToTenant').mockImplementation();

  //   it('should not denormalize when relationship related data has not changed', async () => {
  //     await testingEnvironment.setUp(fixtures, elasticIndex);
  //     const template = {
  //       _id: templateToBeEditedId,
  //       name: 'template to be edited',
  //       commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
  //       properties: [
  //         {
  //           name: 'new_mapped_prop',
  //           label: 'new mapped prop',
  //           type: 'text',
  //         },
  //       ],
  //       default: true,
  //     };

  //     denormalizeTemplateEntities.mockReset();
  //     await TemplateFacade.createWithDefaultValues(template);
  //     expect(denormalizeTemplateEntities).not.toHaveBeenCalled();
  //   });

  //   it.each([
  //     { propChanges: { content: 'NEW CONTENT' } },
  //     { propChanges: { inherit: { property: thesaurusTemplateRelationshipPropId.toString() } } },
  //     { propChanges: { relationType: relatedToAnother.toString() } },
  //     { propChanges: { relationType: relatedToAnother.toString(), content: 'New Content' } },
  //   ])(
  //     'should denormalize when relationship related data has changed ($propChanges)',
  //     async ({ propChanges }) => {
  //       await testingEnvironment.setUp(fixtures, elasticIndex);
  //       const template = factory.template(
  //         '',
  //         [
  //           {
  //             _id: thesaurusTemplateRelationshipPropId,
  //             type: propertyTypes.relationship,
  //             relationType: relatedTo.toString(),
  //             content: templateToBeDeleted,
  //             label: 'relationshipToBeDeleted',
  //             name: 'relationshipToBeDeleted',
  //             ...propChanges,
  //           },
  //         ],
  //         {
  //           _id: thesaurusTemplateId,
  //           name: 'thesauri template',
  //         }
  //       );

  //       denormalizeTemplateEntities.mockReset();
  //       await new Promise((resolve, reject) => {
  //         templates.save(template, 'en', false, false, e => {
  //           if (e) {
  //             reject(e);
  //           }
  //           resolve();
  //         });
  //       });
  //       expect(denormalizeTemplateEntities).toHaveBeenCalled();
  //     }
  //   );
  // });
});
