import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import { RequestParams } from 'app/utils/RequestParams';
import I18NApi from '../I18NApi';

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
      .post(`${APIURL}translations/setasdeafult`, { body: JSON.stringify(okResponse) });
  });

  afterEach(() => backend.restore());

  describe('get()', () => {
    it('should request translations', done => {
      I18NApi.get()
        .then(response => {
          expect(response).toEqual(translations);
          done();
        })
        .catch(done.fail);
    });
  });

  describe('save()', () => {
    it('should post the document data to translations', done => {
      const requestParams = new RequestParams({ locale: 'fr' });
      I18NApi.save(requestParams)
        .then(response => {
          expect(JSON.parse(backend.lastOptions(`${APIURL}translations`).body)).toEqual({
            locale: 'fr',
          });
          expect(response).toEqual(translation);
          done();
        })
        .catch(done.fail);
    });
  });

  describe('addEntry()', () => {
    it('should post the new entry translations', done => {
      const data = { context: 'System', key: 'search', value: 'Buscar' };
      const requestParams = new RequestParams(data);
      I18NApi.addEntry(requestParams)
        .then(response => {
          expect(JSON.parse(backend.lastOptions(`${APIURL}translations/addentry`).body)).toEqual(
            data
          );

          expect(response).toEqual('ok');
          done();
        })
        .catch(done.fail);
    });
  });

  describe('addLanguage()', () => {
    it('should post the new language', done => {
      const data = { label: 'Klingon', key: 'kl' };
      const requestParams = new RequestParams(data);
      I18NApi.addLanguage(requestParams)
        .then(response => {
          expect(JSON.parse(backend.lastOptions(`${APIURL}translations/languages`).body)).toEqual(
            data
          );

          expect(response).toEqual('ok');
          done();
        })
        .catch(done.fail);
    });
  });

  describe('deleteLanguage()', () => {
    it('should delete languages', done => {
      const requestParams = new RequestParams({ key: 'kl' });
      I18NApi.deleteLanguage(requestParams)
        .then(response => {
          expect(response).toEqual('ok');
          done();
        })
        .catch(done.fail);
    });
  });

  describe('setDefaultLanguage()', () => {
    it('should post the default language', done => {
      const requestParams = new RequestParams({ key: 'kl' });
      I18NApi.setDefaultLanguage(requestParams)
        .then(response => {
          expect(
            JSON.parse(backend.lastOptions(`${APIURL}translations/setasdeafult`).body)
          ).toEqual({ key: 'kl' });

          expect(response).toEqual('ok');
          done();
        })
        .catch(done.fail);
    });
  });
});
