import Ajv from 'ajv';
import db from 'api/utils/testing_db';
import documents from 'api/documents/documents.js';
import entities from 'api/entities/entities.js';
import translations from 'api/i18n/translations';
import { elasticClient } from 'api/search/elastic';
import { propertyTypes } from 'shared/propertyTypes';
import * as generatedIdPropertyAutoFiller from 'api/entities/generatedIdPropertyAutoFiller';

import { spyOnEmit } from 'api/eventsbus/eventTesting';
import templates from '../templates';

import fixtures, {
  templateToBeEditedId,
  templateToBeDeleted,
  thesaurusTemplateId,
  thesaurusTemplate2Id,
  thesaurusTemplate3Id,
  templateWithContents,
  swapTemplate,
  templateToBeInherited,
  propertyToBeInherited,
  relatedTo,
  thesauriId1,
  thesauriId2,
  select3id,
  select4id,
} from './fixtures/fixtures';
import { TemplateUpdatedEvent } from '../events/TemplateUpdatedEvent';
import { TemplateDeletedEvent } from '../events/TemplateDeletedEvent';

describe('templates', () => {
  const elasticIndex = 'templates_spec_index';

  const resetTemplateToBeEdited = async () => {
    const [testTemplate] = await templates.get({ _id: templateToBeEditedId });
    testTemplate.name = 'template to be edited';
    testTemplate.properties = [];
    testTemplate.commonProperties = [{ name: 'title', label: 'Title', type: 'text' }];
    return templates.save(testTemplate, 'es', true, false);
  };

  beforeAll(async () => {
    jest.spyOn(translations, 'addContext').mockImplementation(async () => Promise.resolve());
    jest.spyOn(translations, 'updateContext').mockImplementation(() => {});
    await db.setupFixturesAndContext(fixtures, elasticIndex);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('save', () => {
    it('should return the saved template', async () => {
      const newTemplate = {
        name: 'created_template',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          { label: 'fieldLabel', type: 'text' },
          {
            label: 'Generated ID',
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
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          { label: 'field label', type: 'text' },
          { label: 'field_label', type: 'text' },
        ],
      };

      await expect(templates.save(newTemplate)).rejects.toHaveProperty('errors', [
        expect.objectContaining({ keyword: 'uniquePropertyFields' }),
      ]);
    });

    it('should update the elastic mapping with the updated template', async () => {
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

    it('should emit an TemplateUpdatedEvent', async () => {
      const emitSpy = spyOnEmit();
      const template = {
        _id: templateToBeEditedId,
        name: 'template to be edited',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          {
            name: 'other_prop',
            label: 'other prop',
            type: 'text',
          },
        ],
        default: true,
      };

      const previousTemplate = await db.mongodb
        .collection('templates')
        .find({ _id: templateToBeEditedId })
        .toArray();

      await templates.save(template);

      const currentTemplate = await db.mongodb
        .collection('templates')
        .find({ _id: templateToBeEditedId })
        .toArray();

      emitSpy.expectToEmitEvent(TemplateUpdatedEvent, {
        before: previousTemplate[0],
        after: currentTemplate[0],
      });
    });

    describe('when property content changes', () => {
      it('should remove the values from the entities and update them', async () => {
        jest.spyOn(translations, 'updateContext').mockImplementation(() => {});
        jest.spyOn(entities, 'removeValuesFromEntities');
        jest
          .spyOn(entities, 'updateMetadataProperties')
          .mockImplementation(async () => Promise.resolve());
        const changedTemplate = {
          _id: templateWithContents,
          name: 'changed',
          commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
          properties: [
            {
              _id: select3id,
              type: 'select',
              content: thesauriId2.toString(),
              label: 'select3',
            },
            {
              _id: select4id,
              type: propertyTypes.multiselect,
              content: thesauriId2.toString(),
              label: 'select4',
            },
          ],
        };

        await templates.save(changedTemplate);
        expect(entities.removeValuesFromEntities).toHaveBeenCalledWith(
          ['select3', 'select4'],
          templateWithContents
        );
      });
    });

    it('should not allow changing names to existing ones (swap)', async () => {
      const changedTemplate = {
        _id: swapTemplate,
        name: 'swap names template',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          { _id: 'text_id', type: 'text', name: 'text', label: 'Select5' },
          {
            _id: 'select_id',
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
        expect(error).toEqual({ code: 400, message: "Properties can't swap names: text" });
      }
    });

    it('should add it to translations with Entity type', async () => {
      const newTemplate = {
        name: 'created template',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          { label: 'label 1', type: 'text' },
          { label: 'label 2', type: 'text' },
        ],
      };

      const response = await templates.save(newTemplate);
      const expectedValues = {
        'created template': 'created template',
        Title: 'Title',
        'label 1': 'label 1',
        'label 2': 'label 2',
      };

      expect(translations.addContext).toHaveBeenCalledWith(
        response._id.toString(),
        'created template',
        expectedValues,
        'Entity'
      );
    });

    it('should update translations when name of the template changes', async () => {
      const testTemplate = await resetTemplateToBeEdited();
      jest.spyOn(translations, 'updateContext').mockImplementationOnce(() => {});
      testTemplate.name = 'changed name';
      await templates.save(testTemplate, 'es', true, false);

      const expectedContext = {
        'template to be edited': 'changed name',
      };

      expect(translations.updateContext).toHaveBeenLastCalledWith(
        { id: templateToBeEditedId.toString(), label: 'changed name', type: 'Entity' },
        expectedContext,
        [],
        { Title: 'Title', 'changed name': 'changed name' }
      );
    });

    it('should update translations with the name of the title property, and remove old custom value', async () => {
      const testTemplate = await resetTemplateToBeEdited();

      jest.spyOn(translations, 'updateContext').mockImplementationOnce(() => {});
      testTemplate.commonProperties[0].label = 'First New Title';
      await templates.save(testTemplate);
      let expectedContext = {
        'template to be edited': 'template to be edited',
        'First New Title': 'First New Title',
      };
      expect(translations.updateContext).toHaveBeenLastCalledWith(
        { id: templateToBeEditedId.toString(), label: 'template to be edited', type: 'Entity' },
        {},
        ['Title'],
        expectedContext
      );

      testTemplate.commonProperties[0].label = 'Second New Title';
      await templates.save(testTemplate);
      expectedContext = {
        'template to be edited': 'template to be edited',
        'Second New Title': 'Second New Title',
      };
      expect(translations.updateContext).toHaveBeenLastCalledWith(
        { id: templateToBeEditedId.toString(), label: 'template to be edited', type: 'Entity' },
        {},
        ['First New Title'],
        expectedContext
      );
    });

    it('should assign a safe property name based on the label ', async () => {
      const newTemplate = {
        name: 'new template',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          { label: 'new label 1', type: 'text' },
          { label: 'new label 2', type: 'select', content: thesauriId1.toString() },
          { label: 'new label 3', type: 'image' },
          { label: 'new label 4', name: 'name', type: 'text' },
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
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      };
      await templates.save(newTemplate);

      const [newCreatedTemplate] = await templates.get({ name: 'new template default properties' });
      expect(newCreatedTemplate.properties).toEqual([]);
    });

    describe('when passing _id', () => {
      beforeAll(async () => {
        await db.setupFixturesAndContext(fixtures, elasticIndex);
        jest
          .spyOn(entities, 'updateMetadataProperties')
          .mockImplementation(async () => Promise.resolve());
      });

      it('should updateMetadataProperties', async () => {
        jest.spyOn(translations, 'updateContext').mockImplementation(() => {});
        const template = {
          _id: templateToBeEditedId,
          name: 'template to be edited',
          commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
          properties: [],
          default: true,
        };
        const toSave = {
          _id: templateToBeEditedId,
          commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
          name: 'changed name',
        };
        await templates.save(toSave, 'en');
        expect(entities.updateMetadataProperties).toHaveBeenCalledWith(toSave, template, 'en', {
          reindex: true,
          generatedIdAdded: false,
        });
      });

      it('should edit an existing one', async () => {
        jest.spyOn(translations, 'updateContext').mockImplementation(() => {});
        const toSave = {
          _id: templateToBeEditedId,
          name: 'changed name',
          commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        };
        await templates.save(toSave);
        const [edited] = await templates.get(templateToBeEditedId);
        expect(edited.name).toBe('changed name');
      });

      it('should update the translation context for it', async () => {
        const newTemplate = {
          name: 'created template',
          commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
          properties: [
            { label: 'label 1', type: 'text' },
            { label: 'label 2', type: 'text' },
          ],
        };
        jest.spyOn(translations, 'updateContext').mockImplementation(() => {});
        /* eslint-disable no-param-reassign */
        const template1 = await templates.save(newTemplate);
        template1.name = 'new title';
        template1.properties[0].label = 'new label 1';
        template1.properties.pop();
        template1.properties.push({ label: 'label 3', type: 'text' });
        template1.commonProperties[0].label = 'new title label';
        translations.addContext.mockClear();
        const response = await templates.save(template1);

        expect(translations.addContext).not.toHaveBeenCalled();
        expect(translations.updateContext).toHaveBeenCalledWith(
          { id: response._id.toString(), label: 'new title', type: 'Entity' },
          {
            'label 1': 'new label 1',
            'created template': 'new title',
          },
          ['label 2', 'Title'],
          {
            'new label 1': 'new label 1',
            'label 3': 'label 3',
            'new title': 'new title',
            'new title label': 'new title label',
          }
        );
      });

      it('should return the saved template', async () => {
        jest.spyOn(translations, 'updateContext').mockImplementation(() => {});

        const edited = {
          _id: templateToBeEditedId,
          name: 'changed name',
          commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        };
        const template1 = await templates.save(edited);

        expect(template1.name).toBe('changed name');
      });
    });

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
          const templateToUpdate = {
            _id: templateToBeEditedId,
            name: 'template to be edited',
            commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
            properties: [{ name: 'autoId', type: propertyTypes.generatedid, label: 'Auto Id' }],
          };
          await templates.save(templateToUpdate, 'en');

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

  describe('delete', () => {
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
  });

  describe('countByThesauri()', () => {
    it('should return number of templates using a thesauri', async () => {
      const result = await templates.countByThesauri(thesauriId1.toString());

      expect(result).toBe(3);
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
});
