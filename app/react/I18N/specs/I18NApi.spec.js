import I18NApi from '../I18NApi';
import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';

describe('I18NApi', () => {
  const translations = [{ locale: 'es' }, { locale: 'en' }];
  const translation = { locale: 'es' };
  const okResponse = 'ok';

  beforeEach(() => {
    backend.restore();
    backend
    .get(`${APIURL}translations`, { body: JSON.stringify({ rows: translations }) })
    .post(`${APIURL}translations`, { body: JSON.stringify(translation) })
    .post(`${APIURL}translations/addentry`, { body: JSON.stringify(okResponse) })
    .post(`${APIURL}translations/languages`, { body: JSON.stringify(okResponse) })
    .delete(`${APIURL}translations/languages?key=kl`, { body: JSON.stringify(okResponse) })
    .post(`${APIURL}translations/setDefaultLanguage`, { body: JSON.stringify(okResponse) });
  });

  afterEach(() => backend.restore());

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
      const data = { locale: 'fr' };
      I18NApi.save(data)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(`${APIURL}translations`).body)).toEqual(data);
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
        expect(JSON.parse(backend.lastOptions(`${APIURL}translations/addentry`).body))
        .toEqual({ context: 'System', key: 'search', value: 'Buscar' });

        expect(response).toEqual('ok');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('addLanguage()', () => {
    it('should post the new language', (done) => {
      I18NApi.addLanguage('Klingon', 'kl')
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(`${APIURL}translations/languages`).body))
        .toEqual({ label: 'Klingon', key: 'kl' });

        expect(response).toEqual('ok');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('deleteLanguage()', () => {
    it('should delete languages', (done) => {
      I18NApi.deleteLanguage('kl')
      .then((response) => {
        expect(response).toEqual('ok');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setDefaultLanguage()', () => {
    it('should post the default language', (done) => {
      I18NApi.setDefaultLanguage('kl')
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(`${APIURL}translations/setDefaultLanguage`).body))
        .toEqual({ key: 'kl' });

        expect(response).toEqual('ok');
        done();
      })
      .catch(done.fail);
    });
  });
});
