/* eslint-disable max-statements */
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { elasticClient } from '#api/search/elastic.js';
import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import {
  TemplateUpdatedData,
  TemplateUpdatedEvent,
} from '../../../domain/template/events/TemplateUpdatedEvent.js';
import templates from '../templates.js';
import {
  fixtures,
  factory,
  swapTemplate,
  templateToBeEditedId,
  thesauriId1,
} from './fixtures/fixtures.js';

async function updateTemplate(template: TemplateSchema, language = 'en') {
  return templates.save(template, language, true, false);
}

describe('templates', () => {
  const elasticIndex = 'templates_spec_index';

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('Update', () => {
    beforeAll(async () => {
      await testingEnvironment.setUp(fixtures, elasticIndex);
    });

    afterEach(() => {
      applicationEventsBus.clear();
    });

    it('should edit an existing one', async () => {
      const toSave = (await templates.getById(
        factory.id('template to be edited')
      )) as TemplateSchema;

      toSave.name = 'changed name';

      await testingEnvironment.runWithContext(async () => {
        await templates.save(toSave, 'en');
      });
      const [edited] = await templates.get(templateToBeEditedId);
      expect(edited.name).toBe('changed name');
    });

    it('should return the saved template', async () => {
      const edited = factory.template('', [], {
        _id: templateToBeEditedId,
        name: 'changed name',
      });
      const template1 = await testingEnvironment.runWithContext(async () => updateTemplate(edited));
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

      const [previousTemplate] = await db
        .mongodb!.collection('templates')
        .find({ _id: templateToBeEditedId })
        .toArray();

      let emitedEventData: TemplateUpdatedData = {
        before: { name: 'placeholderbefore' },
        after: { name: 'placeholderafter' },
      };
      applicationEventsBus.on(TemplateUpdatedEvent, async data => {
        emitedEventData = data;
      });
      await testingEnvironment.runWithContext(async () => updateTemplate(template));

      const [currentTemplate] = await db
        .mongodb!.collection('templates')
        .find({ _id: templateToBeEditedId })
        .toArray();

      expect(emitedEventData.before._id?.toString()).toEqual(previousTemplate._id.toString());
      expect(emitedEventData.before.properties).toMatchObject([]);

      expect(emitedEventData.after._id?.toString()).toEqual(currentTemplate._id.toString());
      expect(emitedEventData.after.properties).toMatchObject([
        { name: 'other_prop', label: 'other prop', type: 'text' },
      ]);
    });

    it('should not allow to swap property names', async () => {
      const changedTemplate = factory.template(
        'swap names template',
        [
          factory.property('text'),
          factory.property('select5', 'select', {
            content: thesauriId1.toString(),
            label: 'Name to be swapped',
          }),
        ],
        { _id: swapTemplate }
      );

      try {
        await testingEnvironment.runWithContext(async () => updateTemplate(changedTemplate));
        throw new Error('properties have swaped names, should have failed with an error');
      } catch (error) {
        expect(error.message).toContain('Properties cannot swap names');
      }
    });

    it('should update the elastic mapping with the updated template', async () => {
      const template = factory.template(
        'template to be edited',
        [factory.property('new_mapped_prop')],
        {
          _id: templateToBeEditedId,
          name: 'template to be edited',
          default: true,
        }
      );

      const mapping = await elasticClient.indices.getMapping({ index: elasticIndex });

      await testingEnvironment.runWithContext(async () => updateTemplate(template));

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
      const { _id, ...newTemplate } = factory.template('new template', []);
      const testTemplate = await updateTemplate(newTemplate);

      testTemplate.name = 'changed name';
      await testingEnvironment.runWithContext(async () => updateTemplate(testTemplate));

      const dbTranslations = await DefaultTranslationsDataSource(
        TransactionManagerFactory.default()
      )
        .getContextAndKeys(testTemplate._id.toString(), ['changed name', 'new template'])
        .all();

      expect(dbTranslations.find(t => t.key === 'new template')).toBeFalsy();
      expect(dbTranslations.find(t => t.key === 'changed name')).toBeTruthy();
    });

    it('should update translations with the name of the title property, and remove old custom value', async () => {
      const testTemplate = factory.template('template to be edited');
      testTemplate!.commonProperties![0].label = 'First New Title';
      await testingEnvironment.runWithContext(async () => updateTemplate(testTemplate));

      testTemplate!.commonProperties![0].label = 'Second New Title';
      await testingEnvironment.runWithContext(async () => updateTemplate(testTemplate));

      const dbTranslations = await DefaultTranslationsDataSource(
        TransactionManagerFactory.default()
      )
        .getContextAndKeys(testTemplate._id.toString(), ['First New Title', 'Second New Title'])
        .all();

      expect(dbTranslations.find(t => t.key === 'First New Title')).toBeFalsy();
      expect(dbTranslations.find(t => t.key === 'Second New Title')).toBeTruthy();
    });

    it('should update the translation context for it', async () => {
      await testingEnvironment.setUp(fixtures, elasticIndex);
      const { _id, ...newTemplate } = factory.template('created template', [
        { name: 'label_1', label: 'label 1', type: 'text' },
        { name: 'label_2', label: 'label 2', type: 'text' },
      ]);
      const template1 = await updateTemplate(newTemplate);
      let dbTranslations = await DefaultTranslationsDataSource(TransactionManagerFactory.default())
        .getAll()
        .all();
      expect(dbTranslations.find(t => t.key === 'created template')).toBeTruthy();
      expect(dbTranslations.find(t => t.key === 'Title')).toBeTruthy();
      expect(dbTranslations.find(t => t.key === 'label 1')).toBeTruthy();
      expect(dbTranslations.find(t => t.key === 'label 2')).toBeTruthy();

      template1.name = 'new template title';
      template1.properties[0].label = 'new label 1';
      template1.properties.pop();
      template1.properties.push({ name: 'label_3', label: 'label 3', type: 'text' });
      template1.commonProperties[0].label = 'new title label';
      await testingEnvironment.runWithContext(async () => updateTemplate(template1));

      dbTranslations = await DefaultTranslationsDataSource(TransactionManagerFactory.default())
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
      const { _id, ...newTemplate } = factory.template('Country');
      let template1 = await testingEnvironment.runWithContext(async () =>
        updateTemplate(newTemplate)
      );
      let dbTranslations = await DefaultTranslationsDataSource(TransactionManagerFactory.default())
        .getAll()
        .all();

      expect(dbTranslations.filter(t => t.key === 'Country' && t.language === 'en').length).toBe(1);

      template1.commonProperties![0].label = 'Country name';
      template1 = await testingEnvironment.runWithContext(async () => updateTemplate(template1));

      dbTranslations = await DefaultTranslationsDataSource(TransactionManagerFactory.default())
        .getAll()
        .all();

      expect(dbTranslations.filter(t => t.key === 'Country' && t.language === 'en').length).toBe(1);
      expect(
        dbTranslations.filter(t => t.key === 'Country name' && t.language === 'en').length
      ).toBe(1);

      template1.commonProperties![0].label = 'Country';
      template1 = await testingEnvironment.runWithContext(async () => updateTemplate(template1));

      dbTranslations = await DefaultTranslationsDataSource(TransactionManagerFactory.default())
        .getAll()
        .all();

      expect(dbTranslations.filter(t => t.key === 'Country' && t.language === 'en').length).toBe(1);
      expect(
        dbTranslations.filter(t => t.key === 'Country name' && t.language === 'en').length
      ).toBe(0);

      template1.name = 'Country template';
      template1 = await testingEnvironment.runWithContext(async () => updateTemplate(template1));

      dbTranslations = await DefaultTranslationsDataSource(TransactionManagerFactory.default())
        .getAll()
        .all();

      expect(dbTranslations.filter(t => t.key === 'Country' && t.language === 'en').length).toBe(1);
      expect(
        dbTranslations.filter(t => t.key === 'Country template' && t.language === 'en').length
      ).toBe(1);
    });
  });
});
