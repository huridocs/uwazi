import {db_url as dbURL} from 'api/config/database.js';
import references from '../references.js';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import request from 'shared/JSONRequest';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('references', () => {
  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('getAll()', () => {
    it('should return all the references in the database', (done) => {
      references.getAll()
      .then((result) => {
        expect(result.rows.length).toBe(3);
        expect(result.rows[0].type).toBe('reference');
        expect(result.rows[0].title).toBe('reference1');
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('getByDocument()', () => {
    it('should return all the references of a document', (done) => {
      references.getByDocument('source1')
      .then((result) => {
        expect(result.rows.length).toBe(2);
        expect(result.rows[0].sourceDocument).toBe('source1');
        expect(result.rows[1].sourceDocument).toBe('source1');
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('countByRelationType()', () => {
    it('should return number of references using a relationType', (done) => {
      references.countByRelationType('relation2')
      .then((result) => {
        expect(result).toBe(2);
        done();
      }).catch(catchErrors(done));
    });

    it('should return zero when none is using it', (done) => {
      references.countByRelationType('not_used_relation')
      .then((result) => {
        expect(result).toBe(0);
        done();
      }).catch(catchErrors(done));
    });
  });

  describe('save()', () => {
    describe('when the reference type did not exist', () => {
      it('should create a new one and return it', (done) => {
        references.save({title: 'This is important!', sourceDocument: 'sorce1'})
        .then((result) => {
          expect(result.title).toBe('This is important!');
          expect(result.sourceDocument).toBe('sorce1');
          expect(result._id).toBeDefined();
          expect(result._rev).toBeDefined();
          done();
        }).catch(catchErrors(done));
      });
    });

    describe('when the reference type exists', () => {
      it('should update it', (done) => {
        let previouseRev;
        request.get(`${dbURL}/c08ef2532f0bd008ac5174b45e033c00`)
        .then((result) => {
          let reference = result.json;
          reference.sourceDocument = 'source2';
          previouseRev = reference._rev;
          return references.save(reference);
        })
        .then((result) => {
          expect(result.sourceDocument).toBe('source2');
          expect(result._id).toBe('c08ef2532f0bd008ac5174b45e033c00');
          expect(result._rev !== previouseRev).toBe(true);
          done();
        }).catch(catchErrors(done));
      });
    });
  });
});
