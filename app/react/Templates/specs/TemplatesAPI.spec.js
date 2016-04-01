import templates from '~/Templates/TemplatesAPI';
import {APIURL} from '~/config.js';
import backend from 'fetch-mock';

describe('TemplatesAPI', () => {
  let mockResponse = [{templates: 'templates'}];
  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: mockResponse})});
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
});
