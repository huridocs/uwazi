import {db_url as dbURL} from 'api/config/database.js';
import request from 'shared/JSONRequest';
import database from 'api/utils/database.js';

import translations from 'api/i18n/translations';
import settings from '../settings.js';
import fixtures from './fixtures.js';

import {catchErrors} from 'api/utils/jasmineHelpers';

describe('settings', () => {
  beforeEach((done) => {
    spyOn(translations, 'updateContext').and.returnValue(Promise.resolve('ok'));
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('save()', () => {
    let getSettings = () => request.get(dbURL + '/_design/settings/_view/all').then((response) => response.json.rows.map(r => r.value));

    it('should save the settings', (done) => {
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

    it('should return the newly created document', (done) => {
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

    it('should be able to partially update it', (done) => {
      request.get(dbURL + '/1')
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

    describe('when has links', () => {
      it('should create a translation context for the links', (done) => {
        let config = {site_name: 'My collection', links: [{title: 'Page one'}]};
        settings.save(config)
        .then(() => {
          expect(translations.updateContext).toHaveBeenCalledWith('Menu', 'Menu', {}, [], {'Page one': 'Page one'});
          done();
        }).catch(catchErrors(done));
      });

      describe('updating the links', () => {
        it('should update the translation context for the links', (done) => {
          let config = {site_name: 'My collection', links: [{title: 'Page one', localID:'1'}, {title: 'Page two', localID: '2'}]};
          settings.save(config)
          .then(() => {
            config = {site_name: 'My collection', links: [{title: 'Page 1', localID:'1'}, {title: 'Page three', localID: '3'}]};
            return settings.save(config);
          })
          .then(() => {
            expect(translations.updateContext)
            .toHaveBeenCalledWith('Menu', 'Menu', {'Page one': 'Page 1'}, ['Page two'], {'Page 1': 'Page 1', 'Page three': 'Page three'});
            done();
          }).catch(catchErrors(done));
        });
      });
    });

    describe('when there are filter groups', () => {
      it('should create translations for them', (done) => {
        let config = {site_name: 'My collection', filters: [{id: 1, name: 'Judge'}, {id: 2, name: 'Documents', items: [{id: 3, name: 'Cause'}]}]};
        settings.save(config)
        .then(() => {
          expect(translations.updateContext).toHaveBeenCalledWith('Filters', 'Filters', {}, [], {Documents: 'Documents'});
          done();
        }).catch(catchErrors(done));
      });

      it('should update them', (done) => {
        let config = {site_name: 'My collection', filters: [{id: 1, name: 'Judge'}, {id: 2, name: 'Documents', items: []}, {id: 3, name: 'Files', items: []}]};
        settings.save(config)
        .then(() => {
          config = {site_name: 'My collection', filters: [{id: 1, name: 'Judge'}, {id: 2, name: 'Important Documents', items: []}]};
          return settings.save(config);
        })
        .then(() => {
          expect(translations.updateContext)
          .toHaveBeenCalledWith('Filters', 'Filters', {Documents: 'Important Documents'}, ['Files'], {'Important Documents': 'Important Documents'});
          done();
        }).catch(catchErrors(done));
      });
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
