import {db_url as dbURL} from 'api/config/database.js';
import request from 'shared/JSONRequest';
import database from 'api/utils/database.js';

import settings from '../settings.js';
import fixtures from './fixtures.js';

import {catchErrors} from 'api/utils/jasmineHelpers';

describe('settings', () => {
  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('save()', () => {
    let getSettings = () => request.get(dbURL + '/_design/settings/_view/all').then((response) => response.json.rows.map(r => r.value));

    fit('should save the settings', (done) => {
      let config = {site_name: 'My collection'};
      settings.save(config)
      .then(() => {
        return settings.get();
      })
      .then((result) => {
        expect(result.site_name).toBe('My collection');
        expect(result.type).toBe('settings');
        done();
      }).catch(catchErrors(done));
    });

    fit('should return the newly created document', (done) => {
      let config = {site_name: 'New settings'};

      settings.save(config)
      .then((createdDocument) => {
        expect(createdDocument._id).toBeDefined();
        expect(createdDocument._rev).toBeDefined();
        expect(createdDocument.site_name).toBe(config.site_name);
        done();
      })
      .catch(catchErrors(done));
    });

    fit('should be able to partially update it', (done) => {
      request.get(dbURL + '/bc739d367ef40c434bd0ff6a18c9fbec')
      .then((doc) => {
        let modifiedDoc = {_id: doc.json._id, _rev: doc.json._rev, test: 'test'};
        return settings.save(modifiedDoc);
      })
      .then(getSettings)
      .then((docs) => {
        let modifiedDoc = docs.find((d) => d.test === 'test');
        expect(modifiedDoc.site_name).toBe('Uwazi');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('get()', () => {
    describe('if there is no settings on the DB', () => {
      it('should return an empty object', (done) => {
        database.reset_testing_database()
        .then(() => database.import({}))
        .then(() => settings.get())
        .then((result) => {
          expect(result).toEqual({});
          done();
        }).catch(catchErrors(done));
      });
    });
  });
});
