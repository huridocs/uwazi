import thesauris from '../thesauris.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import {db_url as dbUrl} from '../../config/database.js';
import request from '../../../shared/JSONRequest';
import translations from 'api/i18n/translations';

describe('thesauris', () => {
  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('get()', () => {
    it('should return all thesauris by default', (done) => {
      thesauris.get(null, 'es')
      .then((response) => {
        let docs = response.rows;
        expect(docs[0].name).toBe('secret recipes');
        done();
      })
      .catch(done.fail);
    });

    it('should also return entity templates with the entitties as options', (done) => {
      thesauris.get(null, 'es')
      .then((response) => {
        let docs = response.rows;
        expect(docs[2].name).toBe('Judge');
        expect(docs[2].values).toEqual([{id: 'sharedId', label: 'Dredd', icon: 'Icon'}]);
        done();
      })
      .catch(done.fail);
    });

    describe('when passing id', () => {
      it('should return matching thesauri', (done) => {
        thesauris.get('c08ef2532f0bd008ac5174b45e033c94')
        .then((response) => {
          expect(response.rows[0].name).toBe('Top 2 scify books');
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('dictionaries()', () => {
    it('should return all thesauris by default', (done) => {
      thesauris.get()
      .then((response) => {
        let docs = response.rows;
        expect(docs[0].name).toBe('secret recipes');
        done();
      })
      .catch(done.fail);
    });

    describe('when passing id', () => {
      it('should return matching thesauri', (done) => {
        thesauris.get('c08ef2532f0bd008ac5174b45e033c94')
        .then((response) => {
          expect(response.rows[0].name).toBe('Top 2 scify books');
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('delete()', () => {
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
        spyOn(translations, 'deleteContext').and.returnValue(Promise.resolve());
        return thesauris.delete(thesauri.json._id, thesauri.json._rev);
      })
      .then((response) => {
        expect(response.ok).toBe(true);
        expect(translations.deleteContext).toHaveBeenCalledWith('c08ef2532f0bd008ac5174b45e033c93');
        done();
      })
      .catch(done.fail);
    });

    describe('when there is a db error', () => {
      it('return the error in the response', (done) => {
        thesauris.delete('c08ef2532f0bd008ac5174b45e033c93', 'bad_rev')
        .then((response) => {
          expect(response.error.error).toBe('bad_request');
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('save', () => {
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
          spyOn(translations, 'updateContext');
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
