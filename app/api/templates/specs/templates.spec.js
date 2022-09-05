/* eslint-disable max-lines */
/* eslint-disable max-statements */

import Ajv from 'ajv';
import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import documents from 'api/documents/documents.js';
import entities from 'api/entities/entities.js';
import translations from 'api/i18n/translations';
import { elasticClient } from 'api/search/elastic';
import { propertyTypes } from 'shared/propertyTypes';
import * as generatedIdPropertyAutoFiller from 'api/entities/generatedIdPropertyAutoFiller';

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
} from './fixtures/fixtures.js';

describe('templates', () => {
  const elasticIndex = 'templates_spec_index';

  beforeEach(async () => {
    spyOn(translations, 'addContext').and.callFake(async () => Promise.resolve());
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

    it('should create a template', async () => {
      const newTemplate = {
        name: 'created_template',
        properties: [{ label: 'fieldLabel', type: 'text' }],
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      };

      await templates.save(newTemplate);

      const allTemplates = await templates.get();
      const newDoc = allTemplates.find(template => template.name === 'created_template');

      expect(newDoc.name).toBe('created_template');
      expect(newDoc.properties[0].label).toEqual('fieldLabel');
    });

    describe('when property content changes', () => {
      it('should remove the values from the entities and update them', done => {
        spyOn(translations, 'updateContext');
        spyOn(entities, 'removeValuesFromEntities').and.callThrough();
        spyOn(entities, 'updateMetadataProperties').and.callFake(async () => Promise.resolve());
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

        templates
          .save(changedTemplate)
          .then(() => {
            expect(entities.removeValuesFromEntities).toHaveBeenCalledWith(
              ['select3', 'select4'],
              templateWithContents
            );
            done();
          })
          .catch(catchErrors(done));
      });
    });

    it('should not allow changing names to existing ones (swap)', done => {
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

      templates
        .save(changedTemplate)
        .then(() => done.fail('properties have swaped names, should have failed with an error'))
        .catch(error => {
          expect(error).toEqual({ code: 400, message: "Properties can't swap names: text" });
          done();
        });
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
      spyOn(translations, 'updateContext');
      const testTemplate = (await templates.get({ _id: templateToBeEditedId }))[0];

      testTemplate.name = 'changed name';
      await templates.save(testTemplate, 'es', true, false);
      const expectedContext = {
        'template to be edited': 'changed name',
      };

      expect(translations.updateContext).toHaveBeenLastCalledWith(
        templateToBeEditedId.toString(),
        'changed name',
        expectedContext,
        [],
        { Title: 'Title', 'changed name': 'changed name' },
        'Entity'
      );
    });

    it('should update translations with the name of the title property, and remove old custom value', async () => {
      spyOn(translations, 'updateContext');
      const testTemplate = (await templates.get({ _id: templateToBeEditedId }))[0];

      testTemplate.commonProperties[0].label = 'First New Title';
      await templates.save(testTemplate);
      let expectedContext = {
        'template to be edited': 'template to be edited',
        'First New Title': 'First New Title',
      };
      expect(translations.updateContext).toHaveBeenLastCalledWith(
        templateToBeEditedId.toString(),
        'template to be edited',
        {},
        ['Title'],
        expectedContext,
        'Entity'
      );

      testTemplate.commonProperties[0].label = 'Second New Title';
      await templates.save(testTemplate);
      expectedContext = {
        'template to be edited': 'template to be edited',
        'Second New Title': 'Second New Title',
      };
      expect(translations.updateContext).toHaveBeenLastCalledWith(
        templateToBeEditedId.toString(),
        'template to be edited',
        {},
        ['First New Title'],
        expectedContext,
        'Entity'
      );
    });

    it('should assign a safe property name based on the label ', done => {
      const newTemplate = {
        name: 'created_template',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          { label: 'label 1', type: 'text' },
          { label: 'label 2', type: 'select', content: thesauriId1.toString() },
          { label: 'label 3', type: 'image' },
          { label: 'label 4', name: 'name', type: 'text' },
          { label: 'label 5', type: 'geolocation' },
        ],
      };

      templates
        .save(newTemplate)
        .then(() => templates.get())
        .then(allTemplates => {
          const newDoc = allTemplates.find(template => template.name === 'created_template');

          expect(newDoc.properties[0].name).toEqual('label_1');
          expect(newDoc.properties[1].name).toEqual('label_2');
          expect(newDoc.properties[2].name).toEqual('label_3');
          expect(newDoc.properties[3].name).toEqual('label_4');
          expect(newDoc.properties[4].name).toEqual('label_5_geolocation');
          done();
        })
        .catch(catchErrors(done));
    });

    it('should set a default value of [] to properties', async () => {
      const newTemplate = {
        name: 'created_template',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      };
      await templates.save(newTemplate);
      const allTemplates = await templates.get();
      const newDoc = allTemplates.find(template => template.name === 'created_template');
      expect(newDoc.properties).toEqual([]);
    });

    describe('when passing _id', () => {
      beforeEach(() => {
        spyOn(entities, 'updateMetadataProperties').and.callFake(async () => Promise.resolve());
      });

      it('should updateMetadataProperties', done => {
        spyOn(translations, 'updateContext');
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
        templates
          .save(toSave, 'en')
          .then(() => {
            expect(entities.updateMetadataProperties).toHaveBeenCalledWith(toSave, template, 'en', {
              reindex: true,
              generatedIdAdded: false,
            });
            done();
          })
          .catch(catchErrors(done));
      });

      it('should edit an existing one', async done => {
        spyOn(translations, 'updateContext');
        const toSave = {
          _id: templateToBeEditedId,
          name: 'changed name',
          commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        };
        try {
          await templates.save(toSave);
          const [edited] = await templates.get(templateToBeEditedId);
          expect(edited.name).toBe('changed name');
          done();
        } catch (error) {
          catchErrors(done)(error);
        }
      });

      it('should update the translation context for it', done => {
        const newTemplate = {
          name: 'created template',
          commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
          properties: [
            { label: 'label 1', type: 'text' },
            { label: 'label 2', type: 'text' },
          ],
        };
        spyOn(translations, 'updateContext');
        /* eslint-disable no-param-reassign */
        templates
          .save(newTemplate)
          .then(template => {
            template.name = 'new title';
            template.properties[0].label = 'new label 1';
            template.properties.pop();
            template.properties.push({ label: 'label 3', type: 'text' });
            template.commonProperties[0].label = 'new title label';
            translations.addContext.calls.reset();
            return templates.save(template);
            /* eslint-enable no-param-reassign */
          })
          .then(response => {
            expect(translations.addContext).not.toHaveBeenCalled();
            expect(translations.updateContext).toHaveBeenCalledWith(
              response._id.toString(),
              'new title',
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
              },
              'Entity'
            );
            done();
          })
          .catch(done.fail);
      });

      it('should return the saved template', done => {
        spyOn(translations, 'updateContext');
        const edited = {
          _id: templateToBeEditedId,
          name: 'changed name',
          commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        };
        return templates
          .save(edited)
          .then(template => {
            expect(template.name).toBe('changed name');
            done();
          })
          .catch(done.fail);
      });
    });

    describe('generatedId', () => {
      const populateGeneratedIdByTemplateSpy = jest
        .spyOn(generatedIdPropertyAutoFiller, 'populateGeneratedIdByTemplate')
        .mockImplementation(() => Promise.resolve());

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
        expect(metadatas).toEqual([
          { select: [] },
          { select: [] },
          { select: [] },
          { select2: [] },
        ]);
      });
    });

    it('should delete a template when no document is using it', done => {
      spyOn(templates, 'countByTemplate').and.callFake(async () => Promise.resolve(0));
      return templates
        .delete({ _id: templateToBeDeleted })
        .then(response => {
          expect(response).toEqual({ _id: templateToBeDeleted });
          return templates.get();
        })
        .then(allTemplates => {
          const deleted = allTemplates.find(template => template.name === 'to be deleted');
          expect(deleted).not.toBeDefined();
          done();
        })
        .catch(catchErrors(done));
    });

    it('should delete the template translation', done => {
      spyOn(documents, 'countByTemplate').and.callFake(async () => Promise.resolve(0));
      spyOn(translations, 'deleteContext').and.callFake(async () => Promise.resolve());

      return templates
        .delete({ _id: templateToBeDeleted })
        .then(() => {
          expect(translations.deleteContext).toHaveBeenCalledWith(templateToBeDeleted);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should throw an error when there is documents using it', done => {
      spyOn(templates, 'countByTemplate').and.callFake(async () => Promise.resolve(1));
      return templates
        .delete({ _id: templateToBeDeleted })
        .then(() => {
          done.fail(
            'should not delete the template and throw an error because there is some documents associated with the template'
          );
        })
        .catch(error => {
          expect(error.key).toEqual('documents_using_template');
          expect(error.value).toEqual(1);
          done();
        });
    });
  });

  describe('countByThesauri()', () => {
    it('should return number of templates using a thesauri', done => {
      templates
        .countByThesauri(thesauriId1.toString())
        .then(result => {
          expect(result).toBe(3);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should return zero when none is using it', done => {
      templates
        .countByThesauri('not_used_relation')
        .then(result => {
          expect(result).toBe(0);
          done();
        })
        .catch(catchErrors(done));
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

  describe('inherit', () => {
    let savedTemplate;
    beforeEach(async () => {
      savedTemplate = await templates.save({
        name: 'template',
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
