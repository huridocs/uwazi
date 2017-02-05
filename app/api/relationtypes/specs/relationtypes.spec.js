import {db_url as dbURL} from 'api/config/database.js';
import relationtypes from '../relationtypes.js';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import request from 'shared/JSONRequest';
import {catchErrors} from 'api/utils/jasmineHelpers';
import translations from 'api/i18n/translations';

describe('relationtypes', () => {

  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('getAll()', () => {
    it('should return all the relationtypes in the database', (done) => {
      relationtypes.getAll()
      .then((result) => {
        expect(result.rows.length).toBe(3);
        expect(result.rows[0].type).toBe('relationtype');
        expect(result.rows[0].name).toBe('Against');
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('getById()', () => {
    it('should return the relationtype with the id', (done) => {
      relationtypes.getById('8202c463d6158af8065022d9b5014a18')
      .then((result) => {
        expect(result.rows[0]._id).toBe('8202c463d6158af8065022d9b5014a18');
        expect(result.rows[0].name).toBe('Against');
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('save()', () => {
    beforeEach(() => {
      spyOn(translations, 'addContext').and.returnValue(Promise.resolve());
      spyOn(translations, 'updateContext').and.returnValue(Promise.resolve());
    });

    describe('when the relation type did not exist', () => {
      it('should create a new one and return it', (done) => {
        relationtypes.save({name: 'Indiferent'})
        .then((result) => {
          expect(result.name).toBe('Indiferent');
          expect(result.type).toBe('relationtype');
          expect(result._id).toBeDefined();
          expect(result._rev).toBeDefined();
          done();
        }).catch(catchErrors(done));
      });

      it('should create a new translation for it', (done) => {
        relationtypes.save({name: 'Indiferent'})
        .then((response) => {
          expect(translations.addContext).toHaveBeenCalledWith(response._id, 'Indiferent', {Indiferent: 'Indiferent'});
          done();
        }).catch(catchErrors(done));
      });
    });

    describe('when the relation type exists', () => {
      it('should update it', (done) => {
        request.get(`${dbURL}/8202c463d6158af8065022d9b5014a18`)
        .then((result) => {
          let relationtype = result.json;
          relationtype.name = 'Not that Against';
          return relationtypes.save(relationtype);
        })
        .then((result) => {
          expect(result.name).toBe('Not that Against');
          expect(result.type).toBe('relationtype');
          expect(result._id).toBe('8202c463d6158af8065022d9b5014a18');
          expect(result._rev).toBeDefined();
          done();
        }).catch(catchErrors(done));
      });

      it('should update the translation for it', (done) => {
        request.get(`${dbURL}/8202c463d6158af8065022d9b5014a18`)
        .then((result) => {
          let relationtype = result.json;
          relationtype.name = 'Pro';
          return relationtypes.save(relationtype);
        })
        .then((response) => {
          expect(translations.updateContext).toHaveBeenCalledWith(response._id, 'Pro', {Against: 'Pro'}, [], {Pro: 'Pro'});
          done();
        }).catch(catchErrors(done));
      });
    });

    describe('when its duplicated', () => {
      it('should return an error', (done) => {
        let relationtype = {name: 'Against'};
        return relationtypes.save(relationtype)
        .then((result) => {
          expect(result.error).toBe('duplicated_entry');
          done();
        }).catch(catchErrors(done));
      });
    });

    describe('delete()', () => {

      beforeEach(() => {
        spyOn(translations, 'deleteContext').and.returnValue(Promise.resolve());
      });

      it('should remove it from the database and return true', (done) => {
        request.get(`${dbURL}/8202c463d6158af8065022d9b5014a18`)
        .then((result) => {
          let relationtype = result.json;
          return relationtypes.delete(relationtype);
        })
        .then((result) => {
          expect(result).toBe(true);
          return request.get(`${dbURL}/8202c463d6158af8065022d9b5014a18`);
        })
        .catch((response) =>{
          expect(response.json.error).toBe('not_found');
          expect(response.json.reason).toBe('deleted');
          done();
        });
      });

      it('should remove the translation', (done) => {
        request.get(`${dbURL}/8202c463d6158af8065022d9b5014a18`)
        .then((result) => {
          let relationtype = result.json;
          return relationtypes.delete(relationtype);
        })
        .then(() => {
          expect(translations.deleteContext).toHaveBeenCalledWith('8202c463d6158af8065022d9b5014a18');
          done();
        });
      });


      it('when its been use should not delete it and return false', (done) => {
        request.get(`${dbURL}/8202c463d6158af8065022d9b5014ccb`)
        .then((result) => {
          let relationtype = result.json;
          return relationtypes.delete(relationtype);
        })
        .then((result) => {
          expect(result).toBe(false);
          return request.get(`${dbURL}/8202c463d6158af8065022d9b5014ccb`);
        })
        .then((result) => {
          expect(result.json._id).toBe('8202c463d6158af8065022d9b5014ccb');
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });
});
