import templates from '~/Templates/TemplatesAPI';
import {APIURL} from '~/config.js';
import backend from 'fetch-mock';

describe('TemplatesAPI', () => {
  let mockResponse = [{templates: 'templates'}];
  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: mockResponse})})
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
});
