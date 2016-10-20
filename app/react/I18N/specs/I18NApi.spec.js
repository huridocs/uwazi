import I18NApi from '../I18NApi';
import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';

describe('I18NApi', () => {
  let translations = [{locale: 'es'}, {locale: 'en'}];
  let translation = {locale: 'es'};
  let addentryresponse = 'ok';

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'translations', 'GET', {body: JSON.stringify({rows: translations})})
    .mock(APIURL + 'translations', 'POST', {body: JSON.stringify(translation)})
    .mock(APIURL + 'translations/addentry', 'POST', {body: JSON.stringify(addentryresponse)});
  });

  describe('get()', () => {
    it('should request translations', (done) => {
      I18NApi.get()
      .then((response) => {
        expect(response).toEqual(translations);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('save()', () => {
    it('should post the document data to translations', (done) => {
      let data = {locale: 'fr'};
      I18NApi.save(data)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(APIURL + 'translations').body)).toEqual(data);
        expect(response).toEqual(translation);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('addEntry()', () => {
    it('should post the new entry translations', (done) => {
      I18NApi.addEntry('System', 'search', 'Buscar')
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(APIURL + 'translations/addentry').body))
        .toEqual({context: 'System', key: 'search', value: 'Buscar'});

        expect(response).toEqual('ok');
        done();
      })
      .catch(done.fail);
    });
  });
});
