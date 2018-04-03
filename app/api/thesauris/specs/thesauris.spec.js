import translations from 'api/i18n/translations';
import templates from 'api/templates/templates';
import entities from 'api/entities/entities';
import { catchErrors } from 'api/utils/jasmineHelpers';

import db from 'api/utils/testing_db';
import thesauris from '../thesauris.js';
import fixtures, { dictionaryId, dictionaryIdToTranslate, dictionaryValueId } from './fixtures.js';

describe('thesauris', () => {
  beforeEach((done) => {
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('get()', () => {
    it('should return all thesauris including entity templates as options', (done) => {
      thesauris.get(null, 'es')
      .then((dictionaties) => {
        expect(dictionaties.length).toBe(5);
        expect(dictionaties[0].name).toBe('dictionary');
        expect(dictionaties[1].name).toBe('dictionary 2');
        expect(dictionaties[3].name).toBe('entityTemplate');
        expect(dictionaties[3].values).toEqual([{ id: 'sharedId', label: 'spanish entity', icon: 'Icon' }]);
        expect(dictionaties[3].type).toBe('template');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return all thesauris including unpublished documents if user', (done) => {
      thesauris.get(null, 'es', 'user')
      .then((dictionaties) => {
        expect(dictionaties.length).toBe(5);
        expect(dictionaties[3].values).toEqual([
          { id: 'sharedId', label: 'spanish entity', icon: 'Icon' },
          { id: 'other', label: 'unpublished entity' }
        ]);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when passing id', () => {
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
    it('should return all dictionaries', (done) => {
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
      it('should return matching thesauri', (done) => {
        thesauris.dictionaries({ _id: dictionaryId })
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

    it('should delete a thesauri', done => thesauris.delete(dictionaryId)
    .then((response) => {
      expect(response.ok).toBe(true);
      return thesauris.get({ _id: dictionaryId });
    })
    .then((dictionaries) => {
      expect(dictionaries.length).toBe(0);
      done();
    })
    .catch(catchErrors(done)));

    it('should delete the translation', (done) => {
      thesauris.delete(dictionaryId)
      .then((response) => {
        expect(response.ok).toBe(true);
        expect(translations.deleteContext).toHaveBeenCalledWith(dictionaryId);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when the dictionary is in use', () => {
      it('should return an error in the response', (done) => {
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

    it('should create a thesauri', (done) => {
      const _id = db.id();
      const data = { name: 'Batman wish list', values: [{ _id, id: '1', label: 'Joker BFF' }] };

      thesauris.save(data)
      .then((response) => {
        expect(response.values).toEqual([{ _id, id: '1', label: 'Joker BFF' }]);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should create a translation context', (done) => {
      const data = { name: 'Batman wish list', values: [{ id: '1', label: 'Joker BFF' }] };
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

    it('should set a default value of [] to values property if its missing', (done) => {
      const data = { name: 'Scarecrow nightmares' };

      thesauris.save(data)
      .then(() => thesauris.get())
      .then((response) => {
        const newThesauri = response.find(thesauri => thesauri.name === 'Scarecrow nightmares');

        expect(newThesauri.name).toBe('Scarecrow nightmares');
        expect(newThesauri.values).toEqual([]);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when passing _id', () => {
      it('should edit an existing one', (done) => {
        spyOn(translations, 'addContext').and.returnValue(Promise.resolve());
        const data = { _id: dictionaryId, name: 'changed name' };
        return thesauris.save(data)
        .then(() => thesauris.getById(dictionaryId))
        .then((edited) => {
          expect(edited.name).toBe('changed name');
          done();
        })
        .catch(catchErrors(done));
      });

      it('should update the translation', (done) => {
        const data = {
          _id: dictionaryIdToTranslate,
          name: 'Top 1 games',
          values: [
            { id: dictionaryValueId, label: 'Marios game' }
          ]
        };
        return thesauris.save(data)
        .then((response) => {
          expect(translations.updateContext)
          .toHaveBeenCalledWith(
            response._id,
            'Top 1 games',
            { 'Enders game': 'Marios game', 'Top 2 scify books': 'Top 1 games' },
            ['Fundation'],
            { 'Top 1 games': 'Top 1 games', 'Marios game': 'Marios game' }
          );
          done();
        })
        .catch(catchErrors(done));
      });

      it('should remove delted values from entities', (done) => {
        spyOn(entities, 'deleteEntityFromMetadata');
        const data = {
          _id: dictionaryIdToTranslate,
          name: 'Top 1 games',
          values: [
            { id: dictionaryValueId, label: 'Marios game' }
          ]
        };
        return thesauris.save(data)
        .then(() => {
          expect(entities.deleteEntityFromMetadata).toHaveBeenCalledWith('2', dictionaryIdToTranslate);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('when trying to save a duplicated thesauri', () => {
      it('should return an error', (done) => {
        const data = { name: 'dictionary' };
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
