import {db_url as dbURL} from 'api/config/database.js';
import templates from 'api/templates/templates.js';
import documents from 'api/documents/documents.js';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import request from 'shared/JSONRequest';
import {catchErrors} from 'api/utils/jasmineHelpers';
import translations from 'api/i18n/translations';

describe('templates', () => {
  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });


  describe('save', () => {
    let getAllTemplates = () => request.get(dbURL + '/_design/templates/_view/all').then((response) => response.json.rows);
    let getTemplate = (id = 'c08ef2532f0bd008ac5174b45e033c94') => request.get(dbURL + `/${id}`).then((response) => response.json);

    it('should create a template', (done) => {
      let newTemplate = {name: 'created_template', properties: [{label: 'fieldLabel'}]};

      templates.save(newTemplate)
      .then(getAllTemplates)
      .then((allTemplates) => {
        let newDoc = allTemplates.find((template) => {
          return template.value.name === 'created_template';
        });

        expect(newDoc.value.name).toBe('created_template');
        expect(newDoc.value.properties[0].label).toEqual('fieldLabel');
        done();
      })
      .catch(done.fail);
    });

    it('should validate properties not having repeated names and return an error', (done) => {
      let newTemplate = {name: 'created_template', properties: [
        {label: 'label 1'},
        {label: 'label 1'},
        {label: 'Label 2'},
        {label: 'label 2'},
        {label: 'label 3'}
      ]};

      templates.save(newTemplate)
      .then(() => done.fail('properties have repeated names, should have failed with an error'))
      .catch((error) => {
        expect(error.properties.message).toBe('duplicated_labels');
        expect(error.properties.value).toEqual(['label 1', 'label 2']);
        done();
      });
    });

    it('should add it to the translations', (done) => {
      spyOn(translations, 'addContext').and.returnValue(Promise.resolve());
      let newTemplate = {name: 'created template', properties: [
        {label: 'label 1'},
        {label: 'label 2'}
      ]};

      templates.save(newTemplate)
      .then(() => {
        let expectedValues = {
          'created template': 'created template',
          'label 1': 'label 1',
          'label 2': 'label 2'
        };
        expect(translations.addContext).toHaveBeenCalledWith('created template', expectedValues);
        done();
      });
    });

    it('should assign a safe property name based on the label to each', (done) => {
      let newTemplate = {name: 'created_template', properties: [
        {label: 'label 1'},
        {label: 'label 2'},
        {label: 'label 3'},
        {label: 'label 4', name: 'name'}
      ]};

      templates.save(newTemplate)
      .then(getAllTemplates)
      .then((allTemplates) => {
        let newDoc = allTemplates.find((template) => {
          return template.value.name === 'created_template';
        });

        expect(newDoc.value.properties[0].name).toEqual('label_1');
        expect(newDoc.value.properties[1].name).toEqual('label_2');
        expect(newDoc.value.properties[2].name).toEqual('label_3');
        expect(newDoc.value.properties[3].name).toEqual('label_4');
        done();
      })
      .catch(done.fail);
    });

    describe('when updating a property label', () => {
      it('should update the name and update all documents using this template', (done) => {
        let newTemplate = {name: 'created_template', properties: [ {label: 'label 1'}, {label: 'label 2'}]};
        spyOn(templates, 'updateMetadataProperties').and.returnValue(new Promise((resolve) => resolve()));
        templates.save(newTemplate)
        .then((createdTemplate) => getTemplate(createdTemplate.id))
        .then((template) => {
          template.properties[0].label = 'new label 1';
          template.properties[1].label = 'new label 2';
          return templates.save(template);
        })
        .then((updatedTemplate) => {
          expect(templates.updateMetadataProperties).toHaveBeenCalledWith(updatedTemplate.id, {
            label_1: 'new_label_1',
            label_2: 'new_label_2'
          }, []);
          done();
        })
        .catch(done.fail);
      });

      it('should update update the translation context for it', (done) => {
        let newTemplate = {name: 'created template', properties: [ {label: 'label 1'}, {label: 'label 2'}]};
        let template;
        spyOn(documents, 'updateMetadataProperties').and.returnValue(new Promise((resolve) => resolve()));
        spyOn(translations, 'updateContext');
        templates.save(newTemplate)
        .then((createdTemplate) => getTemplate(createdTemplate.id))
        .then((_template) => {
          template = _template;
          spyOn(translations, 'addContext');
          template.name = 'new title';
          template.properties[0].label = 'new label 1';
          template.properties.pop();
          template.properties.push({label: 'label 3'});
          return templates.save(template);
        })
        .then(() => {
          expect(translations.addContext).not.toHaveBeenCalled();
          expect(translations.updateContext).toHaveBeenCalledWith(
            'created template',
            'new title',
            {
              'label 1': 'new label 1',
              'created template': 'new title'
            },
            ['label 2'],
            {'new label 1': 'new label 1', 'label 3': 'label 3', 'new title': 'new title'}
          );
          done();
        })
        .catch(done.fail);
      });
    });

    describe('when removing properties', () => {
      it('should remove the properties on all documents using the template', (done) => {
        let newTemplate = {name: 'created_template', properties: [ {label: 'label 1'}, {label: 'label 2'}, {label: 'label 3'}]};
        spyOn(templates, 'updateMetadataProperties').and.returnValue(new Promise((resolve) => resolve()));
        templates.save(newTemplate)
        .then((createdTemplate) => getTemplate(createdTemplate.id))
        .then((template) => {
          template.properties = [template.properties[1]];
          return templates.save(template);
        })
        .then((updatedTemplate) => {
          expect(templates.updateMetadataProperties).toHaveBeenCalledWith(updatedTemplate.id, {}, ['label_1', 'label_3']);
          done();
        })
        .catch(done.fail);
      });
    });

    it('should set a default value of [] to properties', (done) => {
      let newTemplate = {name: 'created_template'};

      templates.save(newTemplate)
      .then(getAllTemplates)
      .then((allTemplates) => {
        let newDoc = allTemplates.find((template) => {
          return template.value.name === 'created_template';
        });

        expect(newDoc.value.properties).toEqual([]);
        done();
      })
      .catch(done.fail);
    });

    describe('when passing _id and _rev', () => {
      it('edit an existing one', (done) => {
        spyOn(documents, 'updateMetadataProperties').and.returnValue(new Promise((resolve) => resolve()));
        getTemplate()
        .then((template) => {
          let edited = {_id: template._id, _rev: template._rev, name: 'changed name'};
          return templates.save(edited);
        })
        .then((savedTemplate) => getTemplate(savedTemplate.id))
        .then((template) => {
          expect(template.name).toBe('changed name');
          done();
        })
        .catch(done.fail);
      });
    });

    describe('when the template name exists', () => {
      it('should return the error', (done) => {
        let template = {name: 'template_test'};
        templates.save(template)
        .then(() => {
          done.fail('should return an error');
        })
        .catch((error) => {
          expect(error.json).toBe('duplicated_entry');
          done();
        });
      });
    });

    describe('when there is a db error', () => {
      it('should return the error', (done) => {
        spyOn(documents, 'updateMetadataProperties').and.returnValue(new Promise((resolve) => resolve()));
        let badTemplate = {_id: 'c08ef2532f0bd008ac5174b45e033c93', _rev: 'bad_rev', name: ''};
        templates.save(badTemplate)
        .then(() => {
          done.fail('should return an error');
        })
        .catch((error) => {
          expect(error.json.error).toBe('bad_request');
          done();
        });
      });
    });
  });

  describe('countByTemplate', () => {
    it('should return how many documents using the template passed', (done) => {
      templates.countByTemplate('template1')
      .then((count) => {
        expect(count).toBe(2);
        done();
      })
      .catch(done.fail);
    });

    it('should return 0 when no count found', (done) => {
      templates.countByTemplate('newTemplate')
      .then((count) => {
        expect(count).toBe(0);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('delete', () => {
    it('should delete a template when no document is using it', (done) => {
      spyOn(templates, 'countByTemplate').and.returnValue(Promise.resolve(0));
      request.get(dbURL + '/c08ef2532f0bd008ac5174b45e033c93')
      .then(template => {
        return templates.delete(template.json);
      })
      .then((response) => {
        expect(response.ok).toBe(true);
        return request.get(dbURL + '/_design/templates/_view/all');
      })
      .then((response) => {
        let docs = response.json.rows;
        expect(docs.length).toBe(1);
        expect(docs[0].value.name).toBe('template_test2');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete the template translation', (done) => {
      spyOn(documents, 'countByTemplate').and.returnValue(Promise.resolve(0));
      spyOn(translations, 'deleteContext').and.returnValue(Promise.resolve());

      request.get(dbURL + '/c08ef2532f0bd008ac5174b45e033c93')
      .then(template => {
        return templates.delete(template.json);
      })
      .then(() => {
        expect(translations.deleteContext).toHaveBeenCalledWith('template_test');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should throw an error when there is documents using it', (done) => {
      spyOn(templates, 'countByTemplate').and.returnValue(Promise.resolve(1));
      request.get(dbURL + '/c08ef2532f0bd008ac5174b45e033c93')
      .then(template => {
        return templates.delete(template.json);
      })
      .then(() => {
        done.fail('should not delete the template and throw an error because there is some documents associated with the template');
      })
      .catch((error) => {
        expect(error.key).toEqual('documents_using_template');
        expect(error.value).toEqual(1);
        done();
      });
    });
  });

  describe('countByThesauri()', () => {
    it('should return number of templates using a thesauri', (done) => {
      templates.countByThesauri('thesauri1')
      .then((result) => {
        expect(result).toBe(1);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return zero when none is using it', (done) => {
      templates.countByThesauri('not_used_relation')
      .then((result) => {
        expect(result).toBe(0);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('updateMetadataProperties', () => {
    let getDocumentsByTemplate = (template) => request.get(dbURL + '/_design/documents/_view/metadata_by_template?key="' + template + '"')
    .then((response) => {
      return response.json.rows.map((r) => r.value);
    });

    it('should update metadata property names on the documents matching the template', (done) => {
      let nameChanges = {property1: 'new_name1', property2: 'new_name2'};
      templates.updateMetadataProperties('template1', nameChanges)
      .then(() => getDocumentsByTemplate('template1'))
      .then((docs) => {
        expect(docs[0].metadata.new_name1).toBe('value1');
        expect(docs[0].metadata.new_name2).toBe('value2');
        expect(docs[0].metadata.property3).toBe('value3');

        expect(docs[1].metadata.new_name1).toBe('value1');
        expect(docs[1].metadata.new_name2).toBe('value2');
        expect(docs[1].metadata.property3).toBe('value3');
        done();
      })
      .catch(done.fail);
    });

    it('should delete properties passed', (done) => {
      let nameChanges = {property2: 'new_name'};
      let deleteProperties = ['property1', 'property3'];
      templates.updateMetadataProperties('template1', nameChanges, deleteProperties)
      .then(() => getDocumentsByTemplate('template1'))
      .then((docs) => {
        expect(docs[0].metadata.property1).not.toBeDefined();
        expect(docs[0].metadata.new_name).toBe('value2');
        expect(docs[0].metadata.property2).not.toBeDefined();
        expect(docs[0].metadata.property3).not.toBeDefined();

        expect(docs[1].metadata.property1).not.toBeDefined();
        expect(docs[1].metadata.new_name).toBe('value2');
        expect(docs[1].metadata.property2).not.toBeDefined();
        expect(docs[1].metadata.property3).not.toBeDefined();
        done();
      })
      .catch(done.fail);
    });
  });

  describe('selectOptions', () => {
    it('should return all the thesauris and entities with same format as thesauri', (done) => {
      templates.selectOptions()
      .then((result) => {
        expect(result.length).toBe(3);
        expect(result[0].name).toBe('thesauri');
        expect(result[0].type).toBe('thesauri');
        expect(result[1].name).toBe('entity1');
        expect(result[1].type).toBe('entity');
        expect(result[2].name).toBe('entity2');
        expect(result[2].type).toBe('entity');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
