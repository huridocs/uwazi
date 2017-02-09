import thesauris from '../thesauris.js';
import database from '../../utils/database.js';
import {db_url as dbUrl} from '../../config/database.js';
import request from '../../../shared/JSONRequest';
import translations from 'api/i18n/translations';
import templates from 'api/templates/templates';

import {db} from 'api/utils';
import fixtures, {dictionaryId} from './fixtures.js';

describe('thesauris', () => {
  beforeEach((done) => {
    db.clearAllAndLoad(fixtures, (err) => {
      if (err) {
        done.fail(err);
      }
      done();
    });
  });

  describe('get()', () => {
    fit('should return all thesauris including entity templates as options', (done) => {
      thesauris.get(null, 'es')
      .then((thesauris) => {
        expect(thesauris[0].name).toBe('dictionary');
        expect(thesauris[1].name).toBe('dictionary 2');
        expect(thesauris[2].name).toBe('entityTemplate');
        expect(thesauris[2].values).toEqual([{id: 'sharedId', label: 'spanish entity', icon: 'Icon'}]);
        done();
      })
      .catch(done.fail);
    });

    fdescribe('when passing id', () => {
      it('should return matching thesauri', (done) => {
        thesauris.get(dictionaryId)
        .then((response) => {
          expect(response[0].name).toBe('dictionary 2');
          expect(response[0].values[0].label).toBe('value 1');
          expect(response[0].values[1].label).toBe('value 2');
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('delete()', () => {
    let templatesCountSpy;
    beforeEach(() => {
      templatesCountSpy = spyOn(templates, 'countByThesauri').and.returnValue(Promise.resolve(0));
      spyOn(translations, 'deleteContext').and.returnValue(Promise.resolve());
    });

    it('should delete a thesauri', (done) => {
      request.get(dbUrl + '/c08ef2532f0bd008ac5174b45e033c93')
      .then(thesauri => {
        return thesauris.delete(thesauri.json._id, thesauri.json._rev);
      })
      .then((response) => {
        expect(response.ok).toBe(true);
        return request.get(dbUrl + '/_design/thesauris/_view/all');
      })
      .then((response) => {
        let docs = response.json.rows;
        expect(docs.length).toBe(2);
        expect(docs[0].value.name).toBe('Top 2 scify books');
        done();
      })
      .catch(done.fail);
    });

    it('should delete the translation', (done) => {
      request.get(dbUrl + '/c08ef2532f0bd008ac5174b45e033c93')
      .then(thesauri => {
        return thesauris.delete(thesauri.json._id, thesauri.json._rev);
      })
      .then((response) => {
        expect(response.ok).toBe(true);
        expect(translations.deleteContext).toHaveBeenCalledWith('c08ef2532f0bd008ac5174b45e033c93');
        done();
      })
      .catch(done.fail);
    });

    describe('when the dictionary is in use', () => {
      it('should return an error in the response', (done) => {
        templatesCountSpy.and.returnValue(Promise.resolve(1));
        request.get(dbUrl + '/c08ef2532f0bd008ac5174b45e033c93')
        .then(thesauri => {
          return thesauris.delete(thesauri.json._id, thesauri.json._rev);
        })
        .then(done.fail)
        .catch((response) => {
          expect(response.key).toBe('templates_using_dictionary');
          done();
        });
      });
    });
  });

  describe('save', () => {

    beforeEach(() => {
      spyOn(translations, 'updateContext');
    });

    it('should create a thesauri', (done) => {
      let data = {name: 'Batman wish list', values: [{id: '1', label: 'Joker BFF'}]};

      thesauris.save(data)
      .then((response) => {
        expect(response.values).toEqual([{id: '1', label: 'Joker BFF'}]);
        expect(response._rev).toBeDefined();
        done();
      })
      .catch(done.fail);
    });

    it('should create a translation context', (done) => {
      let data = {name: 'Batman wish list', values: [{id: '1', label: 'Joker BFF'}]};
      spyOn(translations, 'addContext');
      thesauris.save(data)
      .then((response) => {
        expect(translations.addContext)
        .toHaveBeenCalledWith(
          response._id,
          'Batman wish list',
          {
            'Batman wish list': 'Batman wish list',
            'Joker BFF': 'Joker BFF'
          }
        );
        done();
      })
      .catch(done.fail);
    });

    it('should set a default value of [] to values property if its missing', (done) => {
      let data = {name: 'Scarecrow nightmares'};
      let postResponse;

      thesauris.save(data)
      .then((response) => {
        postResponse = response;
        return request.get(dbUrl + '/_design/thesauris/_view/all');
      })
      .then((response) => {
        let newDoc = response.json.rows.find((template) => {
          return template.value.name === 'Scarecrow nightmares';
        });

        expect(newDoc.value.name).toBe('Scarecrow nightmares');
        expect(newDoc.value.values).toEqual([]);
        expect(newDoc.value._rev).toBe(postResponse._rev);
        done();
      })
      .catch(done.fail);
    });

    describe('when passing _id and _rev', () => {
      it('edit an existing one', (done) => {
        request.get(dbUrl + '/c08ef2532f0bd008ac5174b45e033c94')
        .then((response) => {
          let template = response.json;
          let data = {_id: template._id, _rev: template._rev, name: 'changed name'};
          return thesauris.save(data);
        })
        .then(() => {
          return request.get(dbUrl + '/c08ef2532f0bd008ac5174b45e033c94');
        })
        .then((response) => {
          let template = response.json;
          expect(template.name).toBe('changed name');
          done();
        })
        .catch(done.fail);
      });

      it('should update the translation', (done) => {
        request.get(dbUrl + '/c08ef2532f0bd008ac5174b45e033c94')
        .then((response) => {
          let template = response.json;
          let data = {
            _id: template._id,
            _rev: template._rev,
            name: 'Top 1 games',
            values: [
              {id: '1', label: 'Marios game'}
            ]
          };
          return thesauris.save(data);
        })
        .then((response) => {
          expect(translations.updateContext)
          .toHaveBeenCalledWith(
            response._id,
            'Top 1 games',
            {'Enders game': 'Marios game', 'Top 2 scify books': 'Top 1 games'},
            ['Fundation'],
            {'Top 1 games': 'Top 1 games', 'Marios game': 'Marios game'}
          );
          done();
        })
        .catch(done.fail);
      });
    });

    describe('when trying to save a duplicated thesauri', () => {
      it('should return an error', (done) => {
        let data = {name: 'secret recipes'};
        thesauris.save(data)
        .then((response) => {
          expect(response.error).toBe('duplicated_entry');
          done();
        })
        .catch(done.fail);
      });
    });

    describe('when there is a db error', () => {
      it('return the error in the response', (done) => {
        let data = {_id: 'c08ef2532f0bd008ac5174b45e033c93', _rev: 'bad_rev', name: ''};

        thesauris.save(data)
        .then((response) => {
          let error = response.error;
          expect(error.error).toBe('bad_request');
          done();
        })
        .catch(done.fail);
      });
    });
  });
});
