import {db_url as dbURL} from 'api/config/database.js';
import relationtypes from '../relationtypes.js';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import request from 'shared/JSONRequest';
import {catchErrors} from 'api/utils/jasmineHelpers';

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
        expect(result.length).toBe(3);
        expect(result[0].type).toBe('relationtype');
        expect(result[0].name).toBe('Against');
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('getById()', () => {
    it('should return the relationtype with the id', (done) => {
      relationtypes.getById('8202c463d6158af8065022d9b5014a18')
      .then((result) => {
        expect(result._id).toBe('8202c463d6158af8065022d9b5014a18');
        expect(result.name).toBe('Against');
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('save()', () => {
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
    });

    describe('delete()', () => {
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
