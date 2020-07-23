/* eslint-disable max-nested-callbacks
/* eslint-disable max-statements */

import Ajv from 'ajv';
import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import documents from 'api/documents/documents.js';
import entities from 'api/entities/entities.js';
import templates from 'api/templates/templates';
import translations from 'api/i18n/translations';

import fixtures, {
  templateToBeEditedId,
  templateToBeDeleted,
  templateWithContents,
  swapTemplate,
  templateToBeInherited,
  propertyToBeInherited,
} from './fixtures.js';

describe('templates', () => {
  beforeEach(done => {
    spyOn(translations, 'addContext').and.returnValue(Promise.resolve());
    db.clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    db.disconnect().then(done);
  });

  describe('save', () => {
    it('should return the saved template', async () => {
      const newTemplate = {
        name: 'created_template',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [{ label: 'fieldLabel', type: 'text' }],
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

    it('should create a template', done => {
      const newTemplate = {
        name: 'created_template',
        properties: [{ label: 'fieldLabel', type: 'text' }],
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      };

      templates
        .save(newTemplate)
        .then(() => templates.get())
        .then(allTemplates => {
          const newDoc = allTemplates.find(template => template.name === 'created_template');

          expect(newDoc.name).toBe('created_template');
          expect(newDoc.properties[0].label).toEqual('fieldLabel');
          done();
        })
        .catch(done.fail);
    });

    describe('when property content changes', () => {
      it('should remove the values from the entities and update them', done => {
        spyOn(translations, 'updateContext');
        spyOn(entities, 'removeValuesFromEntities').and.callThrough();
        spyOn(entities, 'updateMetadataProperties').and.returnValue(Promise.resolve());
        const changedTemplate = {
          _id: templateWithContents,
          name: 'changed',
          commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
          properties: [
            { id: '1', type: 'select', content: 'new_thesauri', label: 'select3' },
            { id: '2', type: 'multiselect', content: 'new_thesauri', label: 'multiselect' },
          ],
        };

        templates
          .save(changedTemplate)
          .then(() => {
            expect(entities.removeValuesFromEntities).toHaveBeenCalledWith(
              ['select3', 'multiselect'],
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
          { id: '1', type: 'text', name: 'text', label: 'Select5' },
          { id: '2', type: 'select', name: 'select5', label: 'Text', content: 'a' },
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

    it('should add it to translations with Entity type', done => {
      const newTemplate = {
        name: 'created template',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          { label: 'label 1', type: 'text' },
          { label: 'label 2', type: 'text' },
        ],
      };

      templates.save(newTemplate).then(response => {
        const expectedValues = {
          'created template': 'created template',
          Title: 'Title',
          'label 1': 'label 1',
          'label 2': 'label 2',
        };

        expect(translations.addContext).toHaveBeenCalledWith(
          response._id,
          'created template',
          expectedValues,
          'Entity'
        );
        done();
      });
    });

    it('should assign a safe property name based on the label ', done => {
      const newTemplate = {
        name: 'created_template',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          { label: 'label 1', type: 'text' },
          { label: 'label 2', type: 'select', content: 's' },
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
        spyOn(entities, 'updateMetadataProperties').and.returnValue(Promise.resolve());
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
            expect(entities.updateMetadataProperties).toHaveBeenCalledWith(toSave, template, 'en');
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
              response._id,
              'new title',
              {
                'label 1': 'new label 1',
                'created template': 'new title',
              },
              ['label 2'],
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
  });

  describe('delete', () => {
    it('should delete properties of other templates using this template as select/relationship', async () => {
      spyOn(templates, 'countByTemplate').and.returnValue(Promise.resolve(0));
      await templates.delete({ _id: templateToBeDeleted });

      const [template] = await templates.get({ name: 'thesauri template 2' });
      expect(template.properties.length).toBe(1);
      expect(template.properties[0].label).toBe('select2');

      const [template2] = await templates.get({ name: 'thesauri template 3' });
      expect(template2.properties.length).toBe(2);
      expect(template2.properties[0].label).toBe('text');
      expect(template2.properties[1].label).toBe('text2');
    });

    it('should delete a template when no document is using it', done => {
      spyOn(templates, 'countByTemplate').and.returnValue(Promise.resolve(0));
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
      spyOn(documents, 'countByTemplate').and.returnValue(Promise.resolve(0));
      spyOn(translations, 'deleteContext').and.returnValue(Promise.resolve());

      return templates
        .delete({ _id: templateToBeDeleted })
        .then(() => {
          expect(translations.deleteContext).toHaveBeenCalledWith(templateToBeDeleted);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should throw an error when there is documents using it', done => {
      spyOn(templates, 'countByTemplate').and.returnValue(Promise.resolve(1));
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
        .countByThesauri('thesauri1')
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
    beforeEach(() => {
      spyOn(translations, 'updateContext');
    });
    it('should set the given ID as the default template', done => {
      templates
        .setAsDefault(templateWithContents.toString())
        .then(([newDefault, oldDefault]) => {
          expect(newDefault.name).toBe('content template');
          expect(oldDefault.name).toBe('template to be edited');
          done();
        })
        .catch(catchErrors(done));
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
        expect(error.errors.some(e => e.params.keyword === 'requireContentForSelectFields')).toBe(
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
