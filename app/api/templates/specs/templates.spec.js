import {db_url as dbURL} from 'api/config/database.js';
import templates from 'api/templates/templates.js';
import documents from 'api/documents/documents.js';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import request from 'shared/JSONRequest';

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

    describe('when updateng a property label', () => {
      it('should should update the name and update all documents using this template', (done) => {
        let newTemplate = {name: 'created_template', properties: [ {label: 'label 1'}, {label: 'label 2'}]};
        spyOn(documents, 'updateMetadataNames').and.returnValue(new Promise((resolve) => resolve()));
        templates.save(newTemplate)
        .then((createdTemplate) => getTemplate(createdTemplate.id))
        .then((template) => {
          template.properties[0].label = 'new label 1';
          template.properties[1].label = 'new label 2';
          return templates.save(template);
        })
        .then((updatedTemplate) => {
          expect(documents.updateMetadataNames).toHaveBeenCalledWith(updatedTemplate.id, {
            label_1: 'new_label_1',
            label_2: 'new_label_2'
          });
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
        spyOn(documents, 'updateMetadataNames').and.returnValue(new Promise((resolve) => resolve()));
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

    describe('when there is a db error', () => {
      it('return the error', (done) => {
        spyOn(documents, 'updateMetadataNames').and.returnValue(new Promise((resolve) => resolve()));
        let badTemplate = {_id: 'c08ef2532f0bd008ac5174b45e033c93', _rev: 'bad_rev'};
        templates.save(badTemplate)
        .then((error) => {
          expect(error.error).toBe('bad_request');
          done();
        })
        .catch(done.fail);
      });
    });
  });
});
