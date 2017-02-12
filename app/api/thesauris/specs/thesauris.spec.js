import thesauris from '../thesauris.js';
import database from '../../utils/database.js';
import {db_url as dbUrl} from '../../config/database.js';
import request from '../../../shared/JSONRequest';
import translations from 'api/i18n/translations';
import templates from 'api/templates/templates';
import {catchErrors} from 'api/utils/jasmineHelpers';

import {db} from 'api/utils';
import fixtures, {dictionaryId, dictionaryIdToTranslate, dictionaryValueId} from './fixtures.js';

describe('thesauris', () => {
  beforeEach((done) => {
    db.clearAllAndLoad(fixtures, (err) => {
      if (err) {
        done.fail(err);
      }
      done();
    });
  });

  afterEach((done) => {
    db.clear(done);
  });

  describe('get()', () => {
    fit('should return all thesauris including entity templates as options', (done) => {
      thesauris.get(null, 'es')
      .then((dictionaties) => {
        expect(dictionaties[0].name).toBe('dictionary');
        expect(dictionaties[1].name).toBe('dictionary 2');
        expect(dictionaties[3].name).toBe('entityTemplate');
        expect(dictionaties[3].values).toEqual([{id: 'sharedId', label: 'spanish entity', icon: 'Icon'}]);
        done();
      })
      .catch(catchErrors(done));
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
        .catch(catchErrors(done));
      });
    });
  });

  describe('dictionaries()', () => {
    fit('should return all dictionaries', (done) => {
      thesauris.dictionaries()
      .then((dictionaties) => {
        expect(dictionaties.length).toBe(3);
        expect(dictionaties[0].name).toBe('dictionary');
        expect(dictionaties[1].name).toBe('dictionary 2');
        expect(dictionaties[2].name).toBe('Top 2 scify books');
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when passing a query', () => {
      fit('should return matching thesauri', (done) => {
        thesauris.dictionaries({_id: dictionaryId})
        .then((response) => {
          expect(response.length).toBe(1);
          expect(response[0].name).toBe('dictionary 2');
          expect(response[0].values[0].label).toBe('value 1');
          expect(response[0].values[1].label).toBe('value 2');
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('delete()', () => {
    let templatesCountSpy;
    beforeEach(() => {
      templatesCountSpy = spyOn(templates, 'countByThesauri').and.returnValue(Promise.resolve(0));
      spyOn(translations, 'deleteContext').and.returnValue(Promise.resolve());
    });

    fit('should delete a thesauri', (done) => {
      return thesauris.delete(dictionaryId)
      .then((response) => {
        expect(response.ok).toBe(true);
        return thesauris.get({_id: dictionaryId});
      })
      .then((dictionaries) => {
        expect(dictionaries.length).toBe(0);
        done();
      })
      .catch(catchErrors(done));
    });

    fit('should delete the translation', (done) => {
      thesauris.delete(dictionaryId)
      .then((response) => {
        expect(response.ok).toBe(true);
        expect(translations.deleteContext).toHaveBeenCalledWith(dictionaryId);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when the dictionary is in use', () => {
      fit('should return an error in the response', (done) => {
        templatesCountSpy.and.returnValue(Promise.resolve(1));
        thesauris.delete(dictionaryId)
        .then(catchErrors(done))
        .catch((response) => {
          expect(response.key).toBe('templates_using_dictionary');
          done();
        });
      });
    });
  });

  describe('save', () => {
    beforeEach(() => {
      spyOn(translations, 'updateContext').and.returnValue(Promise.resolve());
    });

    fit('should create a thesauri', (done) => {
      let _id = db.id();
      let data = {name: 'Batman wish list', values: [{_id, id: '1', label: 'Joker BFF'}]};

      thesauris.save(data)
      .then((response) => {
        expect(response.values).toEqual([{_id, id: '1', label: 'Joker BFF'}]);
        done();
      })
     .catch(catchErrors(done));
    });

    fit('should create a translation context', (done) => {
      let data = {name: 'Batman wish list', values: [{id: '1', label: 'Joker BFF'}]};
      spyOn(translations, 'addContext').and.returnValue(Promise.resolve());
      thesauris.save(data)
      .then((response) => {
        expect(translations.addContext)
        .toHaveBeenCalledWith(
          response._id,
          'Batman wish list',
          {
            'Batman wish list': 'Batman wish list',
            'Joker BFF': 'Joker BFF'
          },
          'Dictionary'
        );
        done();
      })
      .catch(done.fail);
    });

    fit('should set a default value of [] to values property if its missing', (done) => {
      let data = {name: 'Scarecrow nightmares'};

      thesauris.save(data)
      .then((response) => {
        return thesauris.get();
      })
      .then((response) => {
        let newThesauri = response.find((thesauri) => {
          return thesauri.name === 'Scarecrow nightmares';
        });

        expect(newThesauri.name).toBe('Scarecrow nightmares');
        expect(newThesauri.values).toEqual([]);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when passing _id', () => {
      fit('should edit an existing one', (done) => {
        spyOn(translations, 'addContext').and.returnValue(Promise.resolve());
        let data = {_id: dictionaryId, name: 'changed name'};
        return thesauris.save(data)
        .then(() => thesauris.getById(dictionaryId))
        .then((edited) => {
          expect(edited.name).toBe('changed name');
          done();
        })
        .catch(catchErrors(done));
      });

      fit('should update the translation', (done) => {
        const data = {
          _id: dictionaryIdToTranslate,
          name: 'Top 1 games',
          values: [
            {id: dictionaryValueId, label: 'Marios game'}
          ]
        };
        return thesauris.save(data)
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
        .catch(catchErrors(done));
      });
    });

    describe('when trying to save a duplicated thesauri', () => {
      fit('should return an error', (done) => {
        let data = {name: 'dictionary'};
        thesauris.save(data)
        .then(catchErrors(done))
        .catch((response) => {
          expect(response).toBe('duplicated_entry');
          done();
        });
      });
    });
  });
});
