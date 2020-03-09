/** @format */
import instrumentRoutes from 'api/utils/instrumentRoutes.js';
import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';

import topicClassificationRoute from '../routes';
import * as topicClassification from '../api';
import fixtures from './fixtures';

describe('topic classification routes', () => {
  let routes: { get: any; _get: any };

  beforeEach(async () => {
    routes = instrumentRoutes(topicClassificationRoute);
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('GET', () => {
    it('should need authorization', () => {
      const req = { query: { thesaurus: 'thes1' } };
      spyOn(topicClassification, 'getModelForThesaurus').and.returnValue(
        Promise.resolve('response')
      );
      expect(routes.get('/api/models', req)).toNeedAuthorization();
    });

    describe('when passing a thesaurus name as a filter', () => {
      it('should get a single, relevant model', done => {
        spyOn(topicClassification, 'getModelForThesaurus').and.returnValue(
          Promise.resolve('response')
        );
        const req = { query: { thesaurus: 'thes1' } };

        routes
          .get('/api/models', req)
          .then(() => {
            expect(topicClassification.getModelForThesaurus).toHaveBeenCalledWith('thes1');
            done();
          })
          .catch(catchErrors(done));
      });
    });
  });
});
