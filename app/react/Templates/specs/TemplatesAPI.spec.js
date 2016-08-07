import templates from 'app/Templates/TemplatesAPI';
import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';

describe('TemplatesAPI', () => {
  let mockResponse = [{templates: 'array'}];
  let templateResponse = [{template: 'single'}];

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: mockResponse})})
    .mock(APIURL + 'templates/count_by_thesauri?_id=id', 'GET', {body: JSON.stringify({total: 1})})
    .mock(APIURL + 'templates?_id=templateId', 'GET', {body: JSON.stringify({rows: templateResponse})})
    .mock(APIURL + 'templates?_id=id', 'DELETE', {body: JSON.stringify({backednResponse: 'testdelete'})})
    .mock(APIURL + 'templates', 'POST', {body: JSON.stringify({backednResponse: 'test'})});
  });

  describe('get()', () => {
    it('should request templates', (done) => {
      templates.get()
      .then((response) => {
        expect(response).toEqual(mockResponse);
        done();
      })
      .catch(done.fail);
    });

    describe('when passing an id', () => {
      it('should request for the template', (done) => {
        templates.get('templateId')
        .then((response) => {
          expect(response).toEqual(templateResponse);
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('save()', () => {
    it('should post the template data to /templates', (done) => {
      let templateData = {name: 'template name', properties: []};
      templates.save(templateData)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(APIURL + 'templates').body)).toEqual(templateData);
        expect(response).toEqual({backednResponse: 'test'});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the template', (done) => {
      let template = {_id: 'id'};
      templates.delete(template)
      .then((response) => {
        expect(response).toEqual({backednResponse: 'testdelete'});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('countByThesauri()', () => {
    it('should request the templates using a specific thesauri', (done) => {
      let thesauri = {_id: 'id'};
      templates.countByThesauri(thesauri)
      .then((response) => {
        expect(response).toEqual({total: 1});
        done();
      })
      .catch(done.fail);
    });
  });
});
