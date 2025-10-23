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
import { TemplateUpdatedEvent } from '../../core/domain/template/events/TemplateUpdatedEvent';
import templates from '../templates';
import templatesModel from '../templatesModel';
import fixtures, {
  factory,
  swapTemplate,
  templateToBeEditedId,
  thesauriId1,
  thesaurusTemplateId,
} from './fixtures/fixtures';

async function updateTemplate(template, language = 'en') {
  return templates.save(template, language, true, false);
}

describe('templates', () => {
  const elasticIndex = 'templates_spec_index';

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  fdescribe('Update', () => {
    beforeAll(async () => {
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
      await testingEnvironment.setUp(fixtures, elasticIndex);
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
      it('should generate id for all entities related', async () => {
        jest.spyOn(setupSockets, 'emitToTenant').mockImplementation();
        const templateToUpdate = factory.template(
          'template',
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
});
