/** @format */
import instrumentRoutes from 'api/utils/instrumentRoutes.js';
import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';

import topicClassificationRoute from '../routes';
import * as topicClassification from '../api';
import fixtures from './fixtures';

describe('topic classification routes', () => {
  let routes: { get: any; _get: any };

  beforeEach(done => {
    routes = instrumentRoutes(topicClassificationRoute);
    db.clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    db.disconnect()
      .then(done)
      .catch(done);
  });

  describe('GET', () => {
    it('should need authorization', () => {
      const req = {};
      spyOn(topicClassification, 'getModelForThesaurus').and.returnValue(
        Promise.resolve('response')
      );
      expect(routes.get('/api/models', req)).toNeedAuthorization();
    });

    it('should return all models for this database by default', done => {
      spyOn(topicClassification, 'getModelForThesaurus').and.returnValue(
        Promise.resolve('response')
      );
      const req = { query: {} };
      routes
        .get('/api/models', req)
        .then((response: any) => {
          expect(topicClassification.getModelForThesaurus).toHaveBeenCalledWith(undefined);
          expect(response).toEqual('response');
          done();
        })
        .catch(catchErrors(done));
    });

    describe('when passing a thesaurus name as a filter', () => {
      it('should get a single, relevant model', done => {
        spyOn(topicClassification, 'getModelForThesaurus').and.returnValue(
          Promise.resolve('response')
        );
        const req = { query: { model: 'model' } };

        routes
          .get('/api/models', req)
          .then(() => {
            expect(topicClassification.getModelForThesaurus).toHaveBeenCalledWith('model');
            done();
          })
          .catch(catchErrors(done));
      });
    });
  });
});
